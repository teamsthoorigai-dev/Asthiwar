import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  changePasswordController,
  loginController,
  logoutController,
  meController,
} from '../modules/auth/auth.controller.js';
import { validateRequest } from '../middleware/validate.js';
import { requireAdminAuth, requireRole } from '../middleware/auth.js';
import { clientIpKey } from '../middleware/client-ip.js';
import { submittedEmail, trustedDeviceFor } from '../modules/auth/trusted-device.js';
import { changePasswordSchema, loginSchema } from '../modules/auth/auth.schema.js';
import {
  createAdminUserSchema,
  updateAdminUserSchema,
} from '../modules/auth/users.schema.js';
import {
  createAdminUserController,
  listAdminUsersController,
  updateAdminUserController,
} from '../modules/auth/users.controller.js';

const router = Router();

const LOGIN_WINDOW_MS = 15 * 60 * 1000;

const tooManyRequests = (message: string) => ({
  success: false,
  error: { code: 'TOO_MANY_REQUESTS', message },
});

/**
 * Brute-force protection is keyed on the account being attacked, not the source
 * IP, so many addresses cannot multiply the guesses against one account.
 *
 * Keyed that way alone it was also a lockout switch: the seeded admin email is
 * public, and ten bad passwords from anyone kept the real administrator out for
 * fifteen minutes, indefinitely. Browsers that have signed in to the account
 * before carry a trusted-device cookie (trusted-device.ts) and are exempt here;
 * they are limited per device by the next limiter instead.
 */
const loginAccountLimiter = rateLimit({
  windowMs: LOGIN_WINDOW_MS,
  max: 10,
  keyGenerator: (req) => {
    const email = submittedEmail(req);
    return email ? `account:${email}` : `ip:${clientIpKey(req)}`;
  },
  skip: (req) => trustedDeviceFor(req) !== null,
  message: tooManyRequests(
    'Too many login attempts for this account, please try again after 15 minutes'
  ),
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * The same ten attempts, per trusted device. A copied device cookie still needs
 * the password, and gets no more guesses at it than anyone else.
 */
const trustedDeviceLimiter = rateLimit({
  windowMs: LOGIN_WINDOW_MS,
  max: 10,
  keyGenerator: (req) => `device:${trustedDeviceFor(req)}`,
  skip: (req) => trustedDeviceFor(req) === null,
  message: tooManyRequests(
    'Too many login attempts from this browser, please try again after 15 minutes'
  ),
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * A deliberately loose second limit, so one source cannot cycle through many
 * addresses to sidestep the per-account cap. Set well above what a shared
 * corporate or proxy egress IP would produce legitimately.
 */
const loginFloodLimiter = rateLimit({
  windowMs: LOGIN_WINDOW_MS,
  max: 100,
  keyGenerator: (req) => clientIpKey(req),
  message: tooManyRequests('Too many login attempts, please try again after 15 minutes'),
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Keyed on the signed-in account. It used to share the login flood limiter —
 * the same counter, not just the same numbers — so a login flood from anyone in
 * that bucket also blocked every admin from changing their password.
 */
const passwordChangeLimiter = rateLimit({
  windowMs: LOGIN_WINDOW_MS,
  max: 10,
  keyGenerator: (req) => `user:${req.user?.id ?? clientIpKey(req)}`,
  message: tooManyRequests('Too many password change attempts, please try again after 15 minutes'),
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/v1/admin/auth/login — Authenticate admin user
router.post(
  '/login',
  loginFloodLimiter,
  loginAccountLimiter,
  trustedDeviceLimiter,
  validateRequest({ body: loginSchema }),
  loginController
);

// POST /api/v1/admin/auth/logout — Invalidate current session
router.post('/logout', requireAdminAuth, logoutController);

// GET /api/v1/admin/auth/me — Verify active session and return profile
router.get('/me', requireAdminAuth, meController);

/**
 * POST /api/v1/admin/auth/password — Change the signed-in account's password.
 *
 * The controller and service for this were written, tested against, and never
 * routed, so the only way to change an admin password was to reach into the
 * database — while the login screen advertised the seeded default. Rate-limited
 * per account: it takes the current password, so it is another place an
 * attacker with a session could grind at one.
 */
router.post(
  '/password',
  requireAdminAuth,
  passwordChangeLimiter,
  validateRequest({ body: changePasswordSchema }),
  changePasswordController
);

/**
 * Admin accounts (/api/v1/admin/auth/users).
 *
 * `admin_users` has always supported several accounts with distinct roles, and
 * the only way to make one was to run the seed script — so every operator shared
 * the seeded login and the audit trail recorded a single name for everything
 * anyone did. Super-admin only: handing out access is the one thing that must not
 * be delegated to the accounts it creates.
 */
const canManageUsers = requireRole('super_admin');

router.get('/users', requireAdminAuth, canManageUsers, listAdminUsersController);

router.post(
  '/users',
  requireAdminAuth,
  canManageUsers,
  validateRequest({ body: createAdminUserSchema }),
  createAdminUserController
);

router.patch(
  '/users/:id',
  requireAdminAuth,
  canManageUsers,
  validateRequest({ body: updateAdminUserSchema }),
  updateAdminUserController
);

export default router;

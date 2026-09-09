import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  loginController,
  logoutController,
  meController,
  changePasswordController,
} from '../modules/auth/auth.controller.js';
import { validateRequest } from '../middleware/validate.js';
import { requireAdminAuth } from '../middleware/auth.js';
import { loginSchema, changePasswordSchema } from '../modules/auth/auth.schema.js';

const router = Router();

const LOGIN_WINDOW_MS = 15 * 60 * 1000;

const tooManyRequests = (message: string) => ({
  success: false,
  error: { code: 'TOO_MANY_REQUESTS', message },
});

/**
 * Brute-force protection is keyed on the account being attacked, not the source
 * IP.
 *
 * Behind a proxy — Render's load balancer, and Vercel's rewrite in front of it —
 * every request arrives from a small pool of infrastructure addresses. An
 * IP-keyed limiter therefore puts all administrators in one bucket, so ten bad
 * attempts by anyone locked out everyone for fifteen minutes. Keying on the
 * submitted email confines a lockout to the account actually under attack.
 */
const loginAccountLimiter = rateLimit({
  windowMs: LOGIN_WINDOW_MS,
  max: 10,
  keyGenerator: (req) => {
    const email = (req.body as { email?: unknown } | undefined)?.email;
    return typeof email === 'string' && email.trim()
      ? `account:${email.trim().toLowerCase()}`
      : `ip:${req.ip ?? 'unknown'}`;
  },
  message: tooManyRequests(
    'Too many login attempts for this account, please try again after 15 minutes'
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
  message: tooManyRequests('Too many login attempts, please try again after 15 minutes'),
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/v1/admin/auth/login — Authenticate admin user
router.post(
  '/login',
  loginFloodLimiter,
  loginAccountLimiter,
  validateRequest({ body: loginSchema }),
  loginController
);

// POST /api/v1/admin/auth/logout — Invalidate current session
router.post('/logout', requireAdminAuth, logoutController);

// GET /api/v1/admin/auth/me — Verify active session and return profile
router.get('/me', requireAdminAuth, meController);

// POST /api/v1/admin/auth/change-password — Update password and invalidate all sessions
router.post(
  '/change-password',
  requireAdminAuth,
  validateRequest({ body: changePasswordSchema }),
  changePasswordController
);

export default router;

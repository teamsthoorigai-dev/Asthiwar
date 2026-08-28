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

// Rate limiting on login route (10 attempts per 15 minutes)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many login attempts from this IP, please try again after 15 minutes',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/v1/admin/auth/login — Authenticate admin user
router.post('/login', loginLimiter, validateRequest({ body: loginSchema }), loginController);

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

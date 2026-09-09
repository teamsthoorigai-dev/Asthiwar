import { CookieOptions, Request, Response, NextFunction } from 'express';
import { login, logout, changePassword, AuthError } from './auth.service.js';
import { LoginDto, ChangePasswordDto } from './auth.schema.js';
import { SESSION_COOKIE_NAME } from '../../middleware/auth.js';
import { env } from '../../config/env.js';

/**
 * In production the admin UI is served from a different origin than this API,
 * so the session cookie rides on cross-site requests. `sameSite: 'lax'` makes
 * the browser drop it on those XHRs — login succeeds, then every authenticated
 * call 401s. `none` is what lets it through, and it is only honoured alongside
 * `secure`, which is why local dev (plain http://localhost) stays on `lax`.
 */
const sessionCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/',
};

export async function loginController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const credentials = req.body as LoginDto;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.get('user-agent');

    const session = await login(credentials, { ipAddress, userAgent });

    // Set HttpOnly secure session cookie
    res.cookie(SESSION_COOKIE_NAME, session.token, {
      ...sessionCookieOptions,
      expires: session.expiresAt,
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token: session.token,
        user: session.user,
        expiresAt: session.expiresAt,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
      return;
    }
    next(error);
  }
}

export async function logoutController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.sessionToken || req.cookies[SESSION_COOKIE_NAME];
    if (token) {
      await logout(token);
    }

    // Clear session cookie
    res.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions);

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function meController(req: Request, res: Response): Promise<void> {
  res.json({
    success: true,
    data: {
      user: req.user,
    },
  });
}

export async function changePasswordController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const dto = req.body as ChangePasswordDto;
    await changePassword(req.user.id, dto);

    // Clear cookie to enforce re-login with new password
    res.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions);

    res.json({
      success: true,
      message: 'Password changed successfully. Please log in again with your new password.',
    });
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
      return;
    }
    next(error);
  }
}

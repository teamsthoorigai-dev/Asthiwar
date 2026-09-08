import { Request, Response, NextFunction } from 'express';
import { login, logout, changePassword, AuthError } from './auth.service.js';
import { LoginDto, ChangePasswordDto } from './auth.schema.js';
import { SESSION_COOKIE_NAME } from '../../middleware/auth.js';
import { env } from '../../config/env.js';

export async function loginController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const credentials = req.body as LoginDto;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.get('user-agent');

    const session = await login(credentials, { ipAddress, userAgent });

    // Set HttpOnly secure session cookie
    res.cookie(SESSION_COOKIE_NAME, session.token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: session.expiresAt,
      path: '/',
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
    res.clearCookie(SESSION_COOKIE_NAME, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

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
    res.clearCookie(SESSION_COOKIE_NAME, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

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

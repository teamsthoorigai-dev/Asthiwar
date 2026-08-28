import { Request, Response, NextFunction } from 'express';
import { verifySession, AuthError } from '../modules/auth/auth.service.js';

export const SESSION_COOKIE_NAME = 'asthiwar_session';

export async function requireAdminAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token: string | undefined;

    // 1. Check HttpOnly Cookie
    if (req.cookies && req.cookies[SESSION_COOKIE_NAME]) {
      token = req.cookies[SESSION_COOKIE_NAME];
    }

    // 2. Check Authorization Bearer Header
    const authHeader = req.headers['authorization'];
    if (!token && authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication is required to access administrative resources',
        },
      });
      return;
    }

    // 3. Verify session in DB
    const user = await verifySession(token);

    req.user = user;
    req.sessionToken = token;

    next();
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

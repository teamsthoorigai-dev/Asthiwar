import { CookieOptions, Request, Response, NextFunction } from 'express';
import { login, logout, changePassword, AuthError } from './auth.service.js';
import { LoginDto, ChangePasswordDto } from './auth.schema.js';
import { SESSION_COOKIE_NAME } from '../../middleware/auth.js';
import { env } from '../../config/env.js';
import { clientIp } from '../../middleware/client-ip.js';
import { admitAnonymousAuditRecord } from '../../middleware/errorHandler.js';
import { logAuditEvent } from '../../services/audit.service.js';
import { recordAdminAction } from '../../services/admin-audit.js';
import { issueTrustedDevice } from './trusted-device.js';

/**
 * The browser reaches this API through the site's own origin — src/lib/api/client.ts
 * calls relative `/api/...` paths and the Next.js rewrite forwards them — so the
 * session cookie is first-party and `lax` is enough.
 *
 * It was `none` in production, from when the admin UI called the API cross-origin.
 * That no longer served a purpose and kept the cookie attached when the console
 * was loaded inside another site's frame, which is what makes clickjacking an
 * admin action work.
 */
const sessionCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
};

export async function loginController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const credentials = req.body as LoginDto;
    const ipAddress = clientIp(req);
    const userAgent = req.get('user-agent');

    const session = await login(credentials, { ipAddress, userAgent });

    // Set HttpOnly secure session cookie
    res.cookie(SESSION_COOKIE_NAME, session.token, {
      ...sessionCookieOptions,
      expires: session.expiresAt,
    });

    // Exempts this browser from the account-wide login lockout from now on.
    issueTrustedDevice(res, session.user.email);

    logAuditEvent({
      eventType: 'INFO',
      action: 'ADMIN_LOGIN',
      severity: 'LOW',
      actorType: 'ADMIN',
      actorId: session.user.email,
      endpoint: req.originalUrl,
      httpMethod: req.method,
      statusCode: 200,
      ipAddress,
      userAgent,
    }).catch(() => {});

    // The token travels only in the HttpOnly cookie. It was also returned here,
    // where any script on the page could read it — undoing HttpOnly — and no part
    // of the site used it.
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: session.user,
        expiresAt: session.expiresAt,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      // Every refused sign-in is recorded, so guessing at an account shows up in
      // the trail. Anyone can produce these, so they draw on the same per-address
      // budget as other anonymous records; the excess is summarised, not dropped.
      const address = clientIp(req);
      if (admitAnonymousAuditRecord(address)) {
        logAuditEvent({
          eventType: 'WARN',
          action: 'ADMIN_LOGIN_FAILED',
          severity: 'MEDIUM',
          actorType: 'ANONYMOUS_USER',
          actorId: (req.body as LoginDto).email,
          endpoint: req.originalUrl,
          httpMethod: req.method,
          statusCode: error.statusCode,
          errorMessage: error.code,
          ipAddress: address,
          userAgent: req.get('user-agent'),
        }).catch(() => {});
      }

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

    recordAdminAction(req, { action: 'ADMIN_LOGOUT', severity: 'LOW', eventType: 'INFO' });

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

    recordAdminAction(req, { action: 'CHANGE_PASSWORD', severity: 'HIGH' });

    // Clear cookie to enforce re-login with new password
    res.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions);

    res.json({
      success: true,
      message: 'Password changed successfully. Please log in again with your new password.',
    });
  } catch (error) {
    if (error instanceof AuthError) {
      recordAdminAction(req, {
        action: 'CHANGE_PASSWORD_FAILED',
        severity: 'MEDIUM',
        eventType: 'WARN',
        statusCode: error.statusCode,
        metadata: { reason: error.code },
      });

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

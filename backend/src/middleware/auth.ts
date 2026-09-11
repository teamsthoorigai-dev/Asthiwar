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

/**
 * The roles an admin account can hold, ordered by authority.
 *
 * `admin_users.role` has been carried through login, session verification and
 * the /me payload since the table was created, and checked precisely nowhere:
 * every authenticated account could reprice the catalogue, delete components and
 * read the whole CRM. That is authentication standing in for authorisation.
 *
 * Compared case-insensitively because the column is free text and the seed
 * writes 'super_admin' while the column default is 'ADMIN'.
 */
export const ADMIN_ROLES = ['viewer', 'admin', 'super_admin'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

const ROLE_RANK: Record<string, number> = {
  viewer: 0,
  admin: 1,
  super_admin: 2,
};

/**
 * An unrecognised role ranks as the *least* privileged, not the most. A typo in
 * the column, or a role added later and not listed here, must not silently grant
 * more than it names.
 */
export function roleRank(role: string | undefined): number {
  return ROLE_RANK[(role ?? '').toLowerCase().trim()] ?? -1;
}

export function hasAtLeastRole(role: string | undefined, minimum: AdminRole): boolean {
  return roleRank(role) >= ROLE_RANK[minimum];
}

/** Gate a route on a minimum role. Must sit after requireAdminAuth. */
export function requireRole(minimum: AdminRole) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication is required to access administrative resources',
        },
      });
      return;
    }

    if (!hasAtLeastRole(req.user.role, minimum)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_ROLE',
          message: `This action requires the '${minimum}' role. Your account is '${req.user.role}'.`,
        },
      });
      return;
    }

    next();
  };
}

import {
  db,
  adminUsers,
  adminSessions,
  eq,
  and,
  gt,
  lt,
  PUBLISHED_DEFAULT_ADMIN_PASSWORD,
} from '@asthiwar/database';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { env } from '../../config/env.js';
import { AdminUserDto, SessionResult } from './auth.types.js';
import { LoginDto, ChangePasswordDto } from './auth.schema.js';

const SESSION_DURATION_DAYS = 7;

/**
 * Only the SHA-256 of a session token is stored, and only the hash is ever looked
 * up. A lookup that also matched the raw value accepted the stored hash itself as
 * a bearer token, so anyone who could read admin_sessions could sign in with what
 * they read — the exposure hashing exists to prevent. Sessions issued before
 * hashing no longer match anything and simply lapse.
 */
function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Compared against when an email matches no account, at the same cost as a real
 * hash. Returning before bcrypt ran made an unknown email answer in ~5ms and a
 * real one in ~270ms, which listed the admin accounts to anyone who asked.
 */
const DUMMY_PASSWORD_HASH = bcrypt.hashSync(crypto.randomBytes(32).toString('hex'), 12);

/** The seed default is public; production does not accept it as a password. */
export function assertNotPublishedDefault(password: string): void {
  if (env.NODE_ENV === 'production' && password === PUBLISHED_DEFAULT_ADMIN_PASSWORD) {
    throw new AuthError(
      'That password is published in the source code and cannot be used.',
      400,
      'PASSWORD_NOT_ALLOWED'
    );
  }
}

export class AuthError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 401, code = 'UNAUTHORIZED') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export async function login(
  credentials: LoginDto,
  metadata?: { ipAddress?: string; userAgent?: string }
): Promise<SessionResult> {
  const normalizedEmail = credentials.email.toLowerCase().trim();

  // 1. Fetch admin user
  const userRows = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, normalizedEmail))
    .limit(1);

  const user = userRows[0];

  // 2. Verify password with bcrypt — always, so a missing account costs the same
  const isPasswordValid = await bcrypt.compare(
    credentials.password,
    user?.passwordHash ?? DUMMY_PASSWORD_HASH
  );
  if (!user || !isPasswordValid) {
    throw new AuthError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  // Only after the password: saying "disabled" to a wrong password confirmed the
  // account exists to someone who does not know its password.
  if (!user.isActive) {
    throw new AuthError('Account is disabled. Please contact administrator.', 403, 'ACCOUNT_DISABLED');
  }

  if (env.NODE_ENV === 'production' && credentials.password === PUBLISHED_DEFAULT_ADMIN_PASSWORD) {
    throw new AuthError(
      'This account still uses the default password published in the source code, so sign-in ' +
        'is blocked. Set ADMIN_SEED_PASSWORD on the server and redeploy to replace it.',
      403,
      'DEFAULT_PASSWORD_BLOCKED'
    );
  }

  // 3. Generate secure random session token
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

  // Sweep sessions that have already expired.
  await db
    .delete(adminSessions)
    .where(lt(adminSessions.expiresAt, new Date()))
    .catch(() => undefined);

  // 4. Save session in database (store SHA-256 hash so plaintext token is never at rest in DB)
  await db.insert(adminSessions).values({
    userId: user.id,
    token: tokenHash,
    expiresAt,
    ipAddress: metadata?.ipAddress ?? null,
    userAgent: metadata?.userAgent ?? null,
  });

  const userDto: AdminUserDto = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };

  return {
    token,
    user: userDto,
    expiresAt,
  };
}

export async function verifySession(token: string): Promise<AdminUserDto> {
  if (!token) {
    throw new AuthError('Authentication session token is required', 401, 'SESSION_REQUIRED');
  }

  const tokenHash = hashSessionToken(token);

  const sessionRows = await db
    .select({
      sessionId: adminSessions.id,
      expiresAt: adminSessions.expiresAt,
      userId: adminUsers.id,
      email: adminUsers.email,
      fullName: adminUsers.fullName,
      role: adminUsers.role,
      isActive: adminUsers.isActive,
      createdAt: adminUsers.createdAt,
    })
    .from(adminSessions)
    .innerJoin(adminUsers, eq(adminUsers.id, adminSessions.userId))
    .where(
      and(
        eq(adminSessions.token, tokenHash),
        gt(adminSessions.expiresAt, new Date())
      )
    )
    .limit(1);

  if (sessionRows.length === 0) {
    throw new AuthError('Session is invalid or has expired', 401, 'SESSION_EXPIRED');
  }

  const s = sessionRows[0];

  if (!s.isActive) {
    throw new AuthError('Account is disabled', 403, 'ACCOUNT_DISABLED');
  }

  return {
    id: s.userId,
    email: s.email,
    fullName: s.fullName,
    role: s.role,
    isActive: s.isActive,
    createdAt: s.createdAt,
  };
}

export async function logout(token: string): Promise<void> {
  if (!token) return;
  await db.delete(adminSessions).where(eq(adminSessions.token, hashSessionToken(token)));
}

export async function changePassword(
  userId: string,
  dto: ChangePasswordDto
): Promise<void> {
  const userRows = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.id, userId))
    .limit(1);

  if (userRows.length === 0) {
    throw new AuthError('User not found', 404, 'USER_NOT_FOUND');
  }

  const user = userRows[0];

  // Verify current password
  const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
  if (!isMatch) {
    throw new AuthError('Current password is incorrect', 400, 'INCORRECT_CURRENT_PASSWORD');
  }

  assertNotPublishedDefault(dto.newPassword);

  // Hash new password
  const newHash = await bcrypt.hash(dto.newPassword, 12);

  // Update password in DB
  await db
    .update(adminUsers)
    .set({
      passwordHash: newHash,
      updatedAt: new Date(),
    })
    .where(eq(adminUsers.id, userId));

  // Invalidate all active sessions for security to force re-login
  await db.delete(adminSessions).where(eq(adminSessions.userId, userId));
}

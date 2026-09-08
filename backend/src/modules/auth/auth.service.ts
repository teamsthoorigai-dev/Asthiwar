import { db, adminUsers, adminSessions, eq, and, gt } from '@asthiwar/database';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { AdminUserDto, SessionResult } from './auth.types.js';
import { LoginDto, ChangePasswordDto } from './auth.schema.js';

const SESSION_DURATION_DAYS = 7;

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

  if (userRows.length === 0) {
    throw new AuthError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const user = userRows[0];

  if (!user.isActive) {
    throw new AuthError('Account is disabled. Please contact administrator.', 403, 'ACCOUNT_DISABLED');
  }

  // 2. Verify password with bcrypt
  const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AuthError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  // 3. Generate secure random session token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

  // 4. Save session in database
  await db.insert(adminSessions).values({
    userId: user.id,
    token,
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
        eq(adminSessions.token, token),
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
  await db.delete(adminSessions).where(eq(adminSessions.token, token));
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

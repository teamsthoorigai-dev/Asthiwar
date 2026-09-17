import crypto from 'node:crypto';
import { Request, Response } from 'express';
import { env } from '../../config/env.js';

/**
 * A browser that has signed in to an account before.
 *
 * The login lockout is keyed on the email being attacked, and the seeded admin
 * email is published in the repository — so anyone could send ten bad passwords
 * every fifteen minutes and keep the real administrator out for good. Keying the
 * lockout on email *and* IP instead would let a guesser with many addresses
 * multiply their attempts.
 *
 * This is the device-cookie defence: after a successful sign-in the browser gets a
 * signed cookie naming the account. Sign-ins that present it for that account are
 * exempt from the account-wide lockout and counted per device instead. A flood
 * against the email then only locks out browsers that have never signed in to it,
 * while the account-wide cap on everyone else still limits distributed guessing.
 */
export const TRUSTED_DEVICE_COOKIE = 'asthiwar_device';
const TRUSTED_DEVICE_MAX_AGE_DAYS = 180;
const MAX_AGE_MS = TRUSTED_DEVICE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

function signature(payload: string): string {
  return crypto
    .createHmac('sha256', env.SESSION_SECRET)
    .update(`trusted-device:${payload}`)
    .digest('base64url');
}

function submittedEmail(req: Request): string | null {
  const email = (req.body as { email?: unknown } | undefined)?.email;
  return typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : null;
}

/** Called after a successful sign-in. */
export function issueTrustedDevice(res: Response, email: string): void {
  const encodedEmail = Buffer.from(email.trim().toLowerCase()).toString('base64url');
  const issuedAt = Date.now().toString(36);
  const deviceId = crypto.randomBytes(12).toString('base64url');
  const payload = `${encodedEmail}.${issuedAt}.${deviceId}`;

  res.cookie(TRUSTED_DEVICE_COOKIE, `${payload}.${signature(payload)}`, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    // Sent only to the auth routes, which are the only ones that read it.
    path: '/api/v1/admin/auth',
    maxAge: MAX_AGE_MS,
  });
}

/**
 * The device id when the request carries a valid, unexpired device cookie for
 * the email it is signing in as; otherwise null.
 */
export function trustedDeviceFor(req: Request): string | null {
  const email = submittedEmail(req);
  const raw = (req.cookies as Record<string, unknown> | undefined)?.[TRUSTED_DEVICE_COOKIE];
  if (!email || typeof raw !== 'string') return null;

  const parts = raw.split('.');
  if (parts.length !== 4) return null;
  const [encodedEmail, issuedAt, deviceId, mac] = parts;

  const expected = Buffer.from(signature(`${encodedEmail}.${issuedAt}.${deviceId}`));
  const supplied = Buffer.from(mac);
  if (expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) {
    return null;
  }

  if (Buffer.from(encodedEmail, 'base64url').toString() !== email) return null;

  const issued = Number.parseInt(issuedAt, 36);
  if (!Number.isFinite(issued) || Date.now() - issued > MAX_AGE_MS) return null;

  return deviceId;
}

export { submittedEmail };

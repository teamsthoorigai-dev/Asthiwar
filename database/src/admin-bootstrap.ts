import crypto from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { db } from './db';
import { adminUsers } from './schema/index';
import { PUBLISHED_DEFAULT_ADMIN_PASSWORD } from './admin-defaults';

/** The first admin's email when ADMIN_SEED_EMAIL is not set. */
export const DEFAULT_ADMIN_EMAIL = 'admin@asthiwar.com';

/** Where the first admin's password came from. Only a generated one is ever returned. */
export type FirstAdminPasswordSource = 'configured' | 'generated' | 'development-default';

export type FirstAdminResult =
  | { created: false }
  | {
      created: true;
      email: string;
      passwordSource: FirstAdminPasswordSource;
      /** Set only when generated: the one time anyone can read it. */
      generatedPassword?: string;
    };

type Database = Pick<typeof db, 'select' | 'insert'>;

/**
 * The first admin account, created when there is no admin at all.
 *
 * Signing in used to take a separate step — running the seed with
 * ADMIN_SEED_PASSWORD set — and a production deploy that skipped it had no way
 * in. Production rightly refuses the default in admin-defaults.ts: it is in the
 * source, so it is everyone's password.
 *
 * The account is now made on the first start. Its password is
 * ADMIN_SEED_PASSWORD when set; otherwise, in production, a random one, returned
 * so the caller prints it once to the server log, which is how most self-hosted
 * consoles hand over their first login. Development keeps the published default,
 * so a local database works straight after seeding.
 *
 * Does nothing while any admin exists, so it is safe to run on every start. Two
 * instances starting together cannot both make one: the email is unique, and the
 * second insert does nothing.
 */
export async function ensureFirstAdmin(options: {
  production: boolean;
  email?: string;
  password?: string;
  database?: Database;
}): Promise<FirstAdminResult> {
  const database = options.database ?? db;

  const existing = await database.select({ id: adminUsers.id }).from(adminUsers).limit(1);
  if (existing.length > 0) return { created: false };

  const email = (options.email?.trim() || DEFAULT_ADMIN_EMAIL).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error(`ADMIN_SEED_EMAIL '${email}' is not an email address, so no admin account was created.`);
  }

  const configured = options.password?.trim() || undefined;
  const usable =
    configured && !(options.production && configured === PUBLISHED_DEFAULT_ADMIN_PASSWORD)
      ? configured
      : undefined;

  const passwordSource: FirstAdminPasswordSource = usable
    ? 'configured'
    : options.production
      ? 'generated'
      : 'development-default';
  const password =
    usable ??
    (options.production ? crypto.randomBytes(18).toString('base64url') : PUBLISHED_DEFAULT_ADMIN_PASSWORD);

  const inserted = await database
    .insert(adminUsers)
    .values({
      email,
      passwordHash: await bcrypt.hash(password, 12),
      fullName: 'Asthiwar Admin',
      role: 'super_admin',
      isActive: true,
    })
    .onConflictDoNothing({ target: adminUsers.email })
    .returning({ id: adminUsers.id });

  if (inserted.length === 0) return { created: false };

  return passwordSource === 'generated'
    ? { created: true, email, passwordSource, generatedPassword: password }
    : { created: true, email, passwordSource };
}

/** What to print once the first admin exists. The password appears only when it was generated. */
export function firstAdminNotice(result: Extract<FirstAdminResult, { created: true }>): string {
  if (result.passwordSource === 'generated') {
    return [
      '🔐 Created the first admin account. This password is shown once — sign in and change it:',
      `     email:    ${result.email}`,
      `     password: ${result.generatedPassword}`,
      '   To choose them instead, set ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD before the first start.',
    ].join('\n');
  }
  return result.passwordSource === 'configured'
    ? `🔐 Created the first admin account (${result.email}) with the password in ADMIN_SEED_PASSWORD.`
    : `🔐 Created the first admin account (${result.email}) with the development password in database/src/admin-defaults.ts.`;
}

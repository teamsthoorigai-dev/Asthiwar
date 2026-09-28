import { z } from 'zod';
import * as dotenv from 'dotenv';
import path from 'path';

// Load root .env
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  // Defaults to production: a deploy that forgets to set it must fail closed. A
  // development default returned stack traces, trusted any *.ngrok-free.app or
  // *.loca.lt origin (anyone can register one), accepted the published admin
  // password, and dropped the cookie's Secure flag. Local .env files set it.
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  CORS_ORIGIN: z.string().default('http://localhost:3000,http://localhost:5173'),
  // Where a customer reaches this deployment. Notification templates build
  // quotation links against it, so a wrong value sends dead links to customers.
  PUBLIC_BASE_URL: z.string().url().default('http://localhost:3000'),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  // Shared with the Next.js frontend. When its proxy presents this, the client IP
  // it forwards is trusted for rate limiting and audit records. See client-ip.ts.
  API_PROXY_SECRET: z.string().min(32, 'API_PROXY_SECRET must be at least 32 characters').optional(),
  // Proxies between the internet and this process; see the trust proxy setting in app.ts.
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(10).default(1),
  // The first admin account, made on the first start when none exists. See
  // ensureFirstAdmin in the database package for the defaults.
  ADMIN_SEED_EMAIL: z.string().optional(),
  ADMIN_SEED_PASSWORD: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().default('ASTHIWAR <onboarding@resend.dev>'),
  ADMIN_ALERT_EMAIL: z.string().email().default('contact@asthiwar.com'),
  CONTACT_RECIPIENT_EMAIL: z.string().email().optional(),
  WHATSAPP_RECIPIENT_PHONE: z.string().default('919488440123'),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_WHATSAPP_FROM: z.string().default('whatsapp:+14155238886'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.format());
  throw new Error('Invalid environment configuration: SESSION_SECRET (min 32 chars) and DATABASE_URL are strictly required');
}

if (!process.env.NODE_ENV) {
  console.warn('[env] NODE_ENV is not set; running with production behaviour.');
}

/**
 * SESSION_SECRET values published in this repository.
 *
 * The secret signs the trusted-device cookie (modules/auth/trusted-device.ts).
 * Whoever knows it can mint one for any account, each with its own allowance of
 * guesses, and so walk past the per-account login lockout. The example in
 * .env.example is long enough to pass the length check, and a deploy built by
 * copying that file ran on it.
 */
const PUBLISHED_SESSION_SECRETS = new Set([
  'asthiwar-super-secret-development-session-key-change-in-production-min32chars',
]);

if (parsedEnv.data.NODE_ENV === 'production' && PUBLISHED_SESSION_SECRETS.has(parsedEnv.data.SESSION_SECRET.trim())) {
  console.error('❌ SESSION_SECRET is the example value from .env.example. Generate your own: openssl rand -hex 32');
  throw new Error('Invalid environment configuration: SESSION_SECRET is the published example value');
}

export const env = parsedEnv.data;


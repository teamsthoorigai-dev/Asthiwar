import { z } from 'zod';
import * as dotenv from 'dotenv';
import path from 'path';

// Load root .env
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  CORS_ORIGIN: z.string().default('http://localhost:3000,http://localhost:5173'),
  // Where a customer reaches this deployment. Notification templates build
  // quotation links against it, so a wrong value sends dead links to customers.
  PUBLIC_BASE_URL: z.string().url().default('http://localhost:3000'),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  // Shared with the Next.js frontend. When its proxy presents this, the client IP
  // it forwards is trusted for rate limiting and audit records. See client-ip.ts.
  API_PROXY_SECRET: z.string().min(32, 'API_PROXY_SECRET must be at least 32 characters').optional(),
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

export const env = parsedEnv.data;


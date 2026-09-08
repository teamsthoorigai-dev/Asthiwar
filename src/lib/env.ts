import { z } from 'zod';

const isProduction = process.env.NODE_ENV === 'production';

const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: isProduction
    ? z
        .string({
          required_error:
            'NEXT_PUBLIC_API_BASE_URL is required in production. Specify the public API URL.',
        })
        .url('NEXT_PUBLIC_API_BASE_URL must be a valid URL')
    : z
        .string()
        .url('NEXT_PUBLIC_API_BASE_URL must be a valid URL')
        .default('http://localhost:4000'),

  NEXT_PUBLIC_SITE_URL: isProduction
    ? z
        .string({
          required_error:
            'NEXT_PUBLIC_SITE_URL is required in production. Specify the canonical site URL.',
        })
        .url('NEXT_PUBLIC_SITE_URL must be a valid URL')
    : z
        .string()
        .url('NEXT_PUBLIC_SITE_URL must be a valid URL')
        .default('http://localhost:3000'),

  API_BASE_URL_INTERNAL: z
    .string()
    .url('API_BASE_URL_INTERNAL must be a valid URL')
    .optional(),
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || undefined,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
  API_BASE_URL_INTERNAL: process.env.API_BASE_URL_INTERNAL || undefined,
});

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => ` - [${issue.path.join('.')}]: ${issue.message}`)
    .join('\n');
  console.error('\n❌ ASTHIWAR Web Environment Configuration Error:\n' + issues + '\n');
  throw new Error(`Invalid environment configuration in web application:\n${issues}`);
}

export const env = {
  NEXT_PUBLIC_API_BASE_URL: parsed.data.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_SITE_URL: parsed.data.NEXT_PUBLIC_SITE_URL,
  API_BASE_URL_INTERNAL:
    parsed.data.API_BASE_URL_INTERNAL || parsed.data.NEXT_PUBLIC_API_BASE_URL,
};

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { logAuditEvent } from '../services/audit.service.js';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

/**
 * Field names whose values must never reach `audit_logs`.
 *
 * The handler records the whole request body with every error it intercepts,
 * which is the right instinct — you cannot diagnose a failed write without
 * knowing what was written. But the login and change-password routes carry
 * plaintext passwords in that body, so any unexpected failure on those routes
 * (a database blip, a bcrypt fault) would copy a live credential into a table
 * that is now readable through the admin console.
 *
 * Matched as a substring, case-insensitively, so `newPassword`, `currentPassword`
 * and `api_key` are all caught without enumerating every spelling.
 */
const REDACTED_FIELD_PATTERNS = ['password', 'token', 'secret', 'authorization', 'apikey', 'api_key'];

const REDACTED = '[redacted]';

function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase();
  return REDACTED_FIELD_PATTERNS.some((pattern) => normalized.includes(pattern));
}

/**
 * Deep-copy a value with sensitive fields replaced.
 *
 * Recurses because a payload can nest (a credentials object, an array of them).
 * Depth is capped so a cyclic or pathological body cannot hang the handler that
 * is supposed to be reporting the error.
 */
function redactSensitive(value: unknown, depth = 0): unknown {
  if (depth > 6 || value === null || typeof value !== 'object') return value;

  if (Array.isArray(value)) {
    return value.map((entry) => redactSensitive(entry, depth + 1));
  }

  const out: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    out[key] = isSensitiveKey(key) ? REDACTED : redactSensitive(entry, depth + 1);
  }
  return out;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  const statusCode = err instanceof ZodError ? 400 : err.statusCode || 500;
  const code =
    err instanceof ZodError
      ? 'VALIDATION_ERROR'
      : err.code || (statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST');
  const message =
    err instanceof ZodError
      ? 'Invalid request data'
      : err.message || 'An unexpected error occurred';

  const details =
    err instanceof ZodError
      ? err.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        }))
      : err.details;

  // Asynchronously record into PostgreSQL audit_logs table
  logAuditEvent({
    eventType: statusCode >= 500 ? 'ERROR' : 'WARN',
    action: 'API_ERROR_INTERCEPTED',
    severity: statusCode >= 500 ? 'CRITICAL' : 'MEDIUM',
    actorType: (req as any).user ? 'ADMIN' : 'ANONYMOUS_USER',
    actorId: (req as any).user?.id || (req as any).user?.email || null,
    endpoint: req.originalUrl,
    httpMethod: req.method,
    statusCode,
    errorMessage: message,
    errorStack: env.NODE_ENV === 'production' ? undefined : err.stack,
    metadata: {
      errorCode: code,
      body: redactSensitive(req.body),
      query: redactSensitive(req.query),
      params: redactSensitive(req.params),
      details,
    },
    ipAddress: req.ip || req.socket?.remoteAddress,
    userAgent: req.headers['user-agent'],
  }).catch(() => {});

  if (statusCode >= 500) {
    console.error(`[ERROR 500] ${req.method} ${req.originalUrl}:`, err);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
      ...(env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
    },
  });
}

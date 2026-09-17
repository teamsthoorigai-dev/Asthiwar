import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { boundedForAudit, logAuditEvent } from '../services/audit.service.js';
import { clientIp } from './client-ip.js';

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
const REDACTED_FIELD_PATTERNS = [
  'password',
  'token',
  'secret',
  'authorization',
  'apikey',
  'api_key',
  'phone',
  'email',
  'fullname',
  'customername',
  'plotlocation',
  'notes',
  'requirementnotes',
  'address',
];

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

/**
 * SQLSTATE class 22, "data exception": the database refused a value the caller
 * sent — a NUL byte in a path, text where a uuid belongs, a number out of range.
 * That is bad input, not a server fault.
 */
function isPostgresDataException(err: unknown): boolean {
  const candidate = err as { code?: unknown; severity?: unknown };
  return (
    typeof candidate.code === 'string' &&
    /^22[0-9A-Z]{3}$/.test(candidate.code) &&
    typeof candidate.severity === 'string'
  );
}

/**
 * How many error records anonymous callers may add to audit_logs per minute.
 *
 * Every error used to become a row, and anyone can produce errors at will: a
 * disallowed Origin header was a free INSERT on every request, ahead of any rate
 * limit, and a rejected preview stored its whole request body. The console still
 * gets a sample of what anonymous traffic is hitting; beyond it, the server log
 * notes how many were dropped. Errors from signed-in admins are always recorded.
 */
const ANONYMOUS_AUDIT_WINDOW_MS = 60 * 1000;
const ANONYMOUS_AUDIT_MAX_PER_WINDOW = 30;
let anonymousAuditWindowStart = 0;
let anonymousAuditWritten = 0;
let anonymousAuditSuppressed = 0;

function admitAnonymousAuditRecord(): boolean {
  const now = Date.now();
  if (now - anonymousAuditWindowStart >= ANONYMOUS_AUDIT_WINDOW_MS) {
    if (anonymousAuditSuppressed > 0) {
      console.warn(
        `[audit] Dropped ${anonymousAuditSuppressed} anonymous error record(s) over the per-minute cap.`
      );
    }
    anonymousAuditWindowStart = now;
    anonymousAuditWritten = 0;
    anonymousAuditSuppressed = 0;
  }
  if (anonymousAuditWritten < ANONYMOUS_AUDIT_MAX_PER_WINDOW) {
    anonymousAuditWritten++;
    return true;
  }
  anonymousAuditSuppressed++;
  return false;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  const isValidationError = err instanceof ZodError;
  // Read through the AppError shape so the ZodError check above does not narrow it.
  const appError: AppError = err;
  const isDataException = !isValidationError && isPostgresDataException(err);
  const hasExplicitStatus = typeof err.statusCode === 'number';

  // An error nobody raised on purpose — a driver fault, a library throw — carries
  // internal text: Postgres messages and SQLSTATE codes went straight to the
  // caller. It is answered generically; the real message still reaches the audit
  // record and the server log.
  const isUnexpected = !isValidationError && !isDataException && !hasExplicitStatus;

  const statusCode = isValidationError || isDataException ? 400 : appError.statusCode || 500;
  const code = isValidationError
    ? 'VALIDATION_ERROR'
    : isDataException
      ? 'INVALID_INPUT'
      : isUnexpected
        ? 'INTERNAL_SERVER_ERROR'
        : appError.code || (statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST');
  const message = isValidationError
    ? 'Invalid request data'
    : isDataException
      ? 'The request contains a value that could not be processed.'
      : isUnexpected
        ? 'An unexpected error occurred'
        : err.message || 'An unexpected error occurred';

  const details = isValidationError
    ? (err as ZodError).errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      }))
    : isDataException || isUnexpected
      ? undefined
      : appError.details;

  const sanitizedUrl = (req.originalUrl || req.url || '').split('?')[0];

  const isAnonymous = !req.user;
  // A rejected Origin is a browser on another site, not a fault anyone can act on.
  const worthRecording = code !== 'CORS_FORBIDDEN';

  if (worthRecording && (!isAnonymous || admitAnonymousAuditRecord())) {
    logAuditEvent({
      eventType: statusCode >= 500 ? 'ERROR' : 'WARN',
      action: 'API_ERROR_INTERCEPTED',
      severity: statusCode >= 500 ? 'CRITICAL' : 'MEDIUM',
      actorType: isAnonymous ? 'ANONYMOUS_USER' : 'ADMIN',
      actorId: req.user?.id || req.user?.email || undefined,
      endpoint: sanitizedUrl,
      httpMethod: req.method,
      statusCode,
      errorMessage: err.message || message,
      errorStack: env.NODE_ENV === 'production' ? undefined : err.stack,
      metadata: {
        errorCode: isUnexpected || isDataException ? (err.code ?? code) : code,
        body: boundedForAudit(redactSensitive(req.body)),
        query: boundedForAudit(redactSensitive(req.query)),
        params: boundedForAudit(redactSensitive(req.params)),
        details: boundedForAudit(details),
      },
      ipAddress: clientIp(req),
      userAgent: req.headers['user-agent'],
    }).catch(() => {});
  }

  if (statusCode >= 500) {
    console.error(`[ERROR 500] ${req.method} ${sanitizedUrl}:`, err);
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

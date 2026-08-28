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
 * Summarizes request payloads into non-identifying shape metadata for audit logging.
 * Strips all personal identifying information (PII) including names, phone numbers,
 * email addresses, and location strings while preserving structural schema information
 * for debugging.
 */
function summarizePayloadShape(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') {
    if (typeof data === 'string') return { type: 'string', length: data.length };
    return { type: typeof data };
  }
  if (Array.isArray(data)) {
    return {
      type: 'array',
      length: data.length,
      itemSummary: data.length > 0 ? summarizePayloadShape(data[0]) : undefined,
    };
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes('password') ||
      lowerKey.includes('token') ||
      lowerKey.includes('secret') ||
      lowerKey.includes('cookie') ||
      lowerKey.includes('auth')
    ) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'string') {
      result[key] = { type: 'string', length: value.length };
    } else if (typeof value === 'number') {
      result[key] = { type: 'number' };
    } else if (typeof value === 'boolean') {
      result[key] = { type: 'boolean' };
    } else if (Array.isArray(value)) {
      result[key] = {
        type: 'array',
        length: value.length,
      };
    } else if (value && typeof value === 'object') {
      result[key] = summarizePayloadShape(value);
    } else {
      result[key] = { type: typeof value };
    }
  }
  return result;
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

  // Asynchronously record into PostgreSQL audit_logs table with PII-free shape summary
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
      body: summarizePayloadShape(req.body),
      query: summarizePayloadShape(res.locals.query ?? req.query),
      params: summarizePayloadShape(res.locals.params ?? req.params),
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

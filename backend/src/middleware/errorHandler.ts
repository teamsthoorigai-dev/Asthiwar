import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { logAuditEvent } from '../services/audit.service.js';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
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
      body: req.body,
      query: req.query,
      params: req.params,
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

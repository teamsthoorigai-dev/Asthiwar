import { db, auditLogs } from '@asthiwar/database';

export interface LogAuditParams {
  eventType: 'ERROR' | 'WARN' | 'INFO' | 'ADMIN_MUTATION' | 'CALCULATOR_SUBMISSION' | 'NOTIFICATION_DISPATCH';
  action: string;
  severity?: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  actorType?: 'ANONYMOUS_USER' | 'ADMIN' | 'SYSTEM';
  actorId?: string;
  endpoint?: string;
  httpMethod?: string;
  statusCode?: number;
  errorMessage?: string;
  errorStack?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'sessiontoken',
  'authorization',
  'cookie',
  'secret',
  'apikey',
  'api_key',
  'access_token',
  'refreshtoken',
]);

export function sanitizePayload(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizePayload(item));
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizePayload(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Log an audit or error event into PostgreSQL asynchronously without blocking API responses.
 */
export async function logAuditEvent(params: LogAuditParams): Promise<void> {
  try {
    const cleanMetadata = params.metadata ? sanitizePayload(params.metadata) : null;

    await db.insert(auditLogs).values({
      eventType: params.eventType,
      action: params.action,
      severity: params.severity || (params.eventType === 'ERROR' ? 'HIGH' : 'INFO'),
      actorType: params.actorType || 'ANONYMOUS_USER',
      actorId: params.actorId || null,
      endpoint: params.endpoint || null,
      httpMethod: params.httpMethod || null,
      statusCode: params.statusCode || null,
      errorMessage: params.errorMessage || null,
      errorStack: params.errorStack || null,
      metadata: cleanMetadata,
      ipAddress: params.ipAddress || null,
      userAgent: params.userAgent ? params.userAgent.substring(0, 500) : null,
    });
  } catch (err) {
    // Fail silently into console so logging errors never disrupt primary business logic
    console.error('[AUDIT_LOGGER_FALLBACK_ERROR]', err);
  }
}

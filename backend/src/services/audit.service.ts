import { db, auditLogs } from '@asthiwar/database';
import { loggableError } from './db-errors.js';

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
  'phone',
  'customerphone',
  'email',
  'customeremail',
  'fullname',
  'customername',
  'plotlocation',
  'notes',
  'requirementnotes',
  'address',
]);

function maskIdentifier(id?: string): string | null {
  if (!id) return null;
  if (id.includes('@')) {
    const parts = id.split('@');
    const name = parts[0];
    const masked = name.length > 2 ? name.substring(0, 2) + '****' : name[0] + '****';
    return `${masked}@${parts[1]}`;
  }
  const digits = id.replace(/\D/g, '');
  if (digits.length >= 10) {
    return id.substring(0, 3) + '****' + id.substring(id.length - 3);
  }
  return id;
}

/** Deeper than any payload this API accepts; a cap so a pathological one cannot overflow the stack. */
const MAX_SANITIZE_DEPTH = 10;

export function sanitizePayload(obj: any, depth = 0): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (depth > MAX_SANITIZE_DEPTH) return '[TRUNCATED]';

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizePayload(item, depth + 1));
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizePayload(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Size limits on what one audit row may hold.
 *
 * Callers pass request bodies and validation details straight through, and
 * those are as large as whatever a client sent: a rejected preview stored 2.9 MB
 * of JSON in a single row. Enough is kept to diagnose — the shape of the value
 * and its size — without letting a request decide how much the table grows.
 */
const MAX_AUDIT_VALUE_BYTES = 4 * 1024;
const MAX_AUDIT_METADATA_BYTES = 16 * 1024;
const MAX_AUDIT_MESSAGE_LENGTH = 2000;
const MAX_AUDIT_STACK_LENGTH = 8000;

export function boundedForAudit(value: unknown, maxBytes = MAX_AUDIT_VALUE_BYTES): unknown {
  if (value === undefined || value === null) return value;

  let serialized: string | undefined;
  try {
    serialized = JSON.stringify(value);
  } catch {
    return '[UNSERIALIZABLE]';
  }
  if (serialized === undefined) return undefined;

  const bytes = Buffer.byteLength(serialized);
  if (bytes <= maxBytes) return value;

  return {
    truncated: true,
    bytes,
    ...(Array.isArray(value)
      ? { length: value.length, first: value.slice(0, 5) }
      : typeof value === 'object'
        ? { keys: Object.keys(value as object).slice(0, 50) }
        : {}),
  };
}

function truncate(text: string | undefined, max: number): string | null {
  if (!text) return null;
  return text.length > max ? `${text.slice(0, max)}… [truncated]` : text;
}

/**
 * Log an audit or error event into PostgreSQL asynchronously without blocking API responses.
 */
export async function logAuditEvent(params: LogAuditParams): Promise<void> {
  try {
    const cleanMetadata = params.metadata
      ? (boundedForAudit(sanitizePayload(params.metadata), MAX_AUDIT_METADATA_BYTES) as Record<string, any>)
      : null;
    const cleanEndpoint = params.endpoint ? params.endpoint.split('?')[0] : null;

    await db.insert(auditLogs).values({
      eventType: params.eventType,
      action: params.action,
      severity: params.severity || (params.eventType === 'ERROR' ? 'HIGH' : 'INFO'),
      actorType: params.actorType || 'ANONYMOUS_USER',
      actorId: maskIdentifier(params.actorId),
      endpoint: cleanEndpoint,
      httpMethod: params.httpMethod || null,
      statusCode: params.statusCode || null,
      errorMessage: truncate(params.errorMessage, MAX_AUDIT_MESSAGE_LENGTH),
      errorStack: truncate(params.errorStack, MAX_AUDIT_STACK_LENGTH),
      metadata: cleanMetadata,
      ipAddress: params.ipAddress || null,
      userAgent: params.userAgent ? params.userAgent.substring(0, 500) : null,
    });
  } catch (err) {
    // Fail silently into console so logging errors never disrupt primary business logic
    console.error('[AUDIT_LOGGER_FALLBACK_ERROR]', loggableError(err));
  }
}

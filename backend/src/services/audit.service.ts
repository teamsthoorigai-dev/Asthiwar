import { db, auditLogs, desc, eq, and, gte, lte, sql } from '@asthiwar/database';

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

export interface AuditLogQueryFilters {
  eventType?: string;
  action?: string;
  severity?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

/**
 * Retrieve paginated audit logs for admin inspection.
 */
export async function queryAuditLogs(filters: AuditLogQueryFilters = {}) {
  const page = Math.max(1, filters.page || 1);
  const limit = Math.min(100, Math.max(1, filters.limit || 50));
  const offset = (page - 1) * limit;

  const conditions = [];

  if (filters.eventType) {
    conditions.push(eq(auditLogs.eventType, filters.eventType));
  }
  if (filters.action) {
    conditions.push(eq(auditLogs.action, filters.action));
  }
  if (filters.severity) {
    conditions.push(eq(auditLogs.severity, filters.severity));
  }
  if (filters.startDate) {
    conditions.push(gte(auditLogs.createdAt, new Date(filters.startDate)));
  }
  if (filters.endDate) {
    conditions.push(lte(auditLogs.createdAt, new Date(filters.endDate)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const totalCountResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(auditLogs)
    .where(whereClause);

  const total = Number(totalCountResult[0]?.count || 0);
  const totalPages = Math.ceil(total / limit);

  const logs = await db
    .select()
    .from(auditLogs)
    .where(whereClause)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    items: logs,
    page,
    limit,
    total,
    totalPages,
  };
}

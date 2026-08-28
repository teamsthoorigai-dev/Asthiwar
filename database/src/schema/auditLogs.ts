import { pgTable, serial, text, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  eventType: text('event_type').notNull(), // 'ERROR', 'WARN', 'INFO', 'ADMIN_MUTATION', 'CALCULATOR_SUBMISSION', 'NOTIFICATION_DISPATCH'
  action: text('action').notNull(), // 'UPDATE_PRICE', 'CREATE_ESTIMATE', 'UNHANDLED_EXCEPTION', 'PDF_STREAM', 'LOGIN', etc.
  severity: text('severity').default('INFO').notNull(), // 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  actorType: text('actor_type').default('ANONYMOUS_USER').notNull(), // 'ANONYMOUS_USER', 'ADMIN', 'SYSTEM'
  actorId: text('actor_id'), // Admin user ID, session ID, or client IP
  endpoint: text('endpoint'), // e.g. /api/v1/calculator/estimate
  httpMethod: text('http_method'), // 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'
  statusCode: integer('status_code'),
  errorMessage: text('error_message'),
  errorStack: text('error_stack'),
  metadata: jsonb('metadata'), // Sanitized payload, query params, execution time, etc.
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

import { Request } from 'express';
import { logAuditEvent, LogAuditParams } from './audit.service.js';
import { clientIp } from '../middleware/client-ip.js';

/**
 * Record an action taken through the admin console, attributed to the signed-in
 * account.
 *
 * Only some admin writes were recorded: a city's price multiplier, a brand's
 * rates, an add-on's price, the brand a package includes — each changes what
 * customers are quoted, and none left a trace of who changed it or when.
 *
 * Fire-and-forget, like every audit write here: a failed audit insert must not
 * fail the change it describes.
 */
export function recordAdminAction(
  req: Request,
  event: {
    action: string;
    severity: NonNullable<LogAuditParams['severity']>;
    eventType?: LogAuditParams['eventType'];
    statusCode?: number;
    metadata?: Record<string, unknown>;
  }
): void {
  logAuditEvent({
    eventType: event.eventType ?? 'ADMIN_MUTATION',
    action: event.action,
    severity: event.severity,
    actorType: 'ADMIN',
    actorId: req.user?.email || req.user?.id,
    endpoint: req.originalUrl,
    httpMethod: req.method,
    statusCode: event.statusCode ?? 200,
    metadata: event.metadata,
    ipAddress: clientIp(req),
    userAgent: req.headers['user-agent'],
  }).catch(() => {});
}

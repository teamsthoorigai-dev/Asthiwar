import { Request, Response, NextFunction } from 'express';
import {
  sendEstimateQuotationNotification,
  sendAdminNewLeadAlert,
  NotificationError,
} from './notifications.service.js';
import { recordAdminAction } from '../../services/admin-audit.js';

export async function sendEstimateNotificationController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const channels = req.body.channels || ['EMAIL', 'WHATSAPP'];
    const results = await sendEstimateQuotationNotification(id, channels);

    // Channels and outcomes only: the records carry the customer's contact
    // details and their quotation link.
    recordAdminAction(req, {
      action: 'SEND_ESTIMATE_NOTIFICATION',
      severity: 'MEDIUM',
      eventType: 'NOTIFICATION_DISPATCH',
      metadata: {
        estimateRef: id,
        dispatched: results.map((record) => ({ channel: record.channel, status: record.status })),
      },
    });

    res.json({
      success: true,
      // Queued, not sent: there is no transport wired up. See notifications.service.ts.
      message: 'Estimate quotation queued for dispatch',
      data: results,
    });
  } catch (error) {
    if (error instanceof NotificationError) {
      res.status(error.statusCode).json({
        success: false,
        error: { code: error.code, message: error.message },
      });
      return;
    }
    next(error);
  }
}

export async function sendLeadNotificationController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const result = await sendAdminNewLeadAlert(id);

    recordAdminAction(req, {
      action: 'SEND_LEAD_NOTIFICATION',
      severity: 'LOW',
      eventType: 'NOTIFICATION_DISPATCH',
      metadata: { enquiryId: id, status: result.status },
    });

    res.json({
      success: true,
      message: 'Admin lead alert queued for dispatch',
      data: result,
    });
  } catch (error) {
    if (error instanceof NotificationError) {
      res.status(error.statusCode).json({
        success: false,
        error: { code: error.code, message: error.message },
      });
      return;
    }
    next(error);
  }
}

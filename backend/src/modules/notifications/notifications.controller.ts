import { Request, Response, NextFunction } from 'express';
import {
  sendEstimateQuotationNotification,
  sendAdminNewLeadAlert,
  NotificationError,
} from './notifications.service.js';

export async function sendEstimateNotificationController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const channels = req.body.channels || ['EMAIL', 'WHATSAPP'];
    const results = await sendEstimateQuotationNotification(id, channels);
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

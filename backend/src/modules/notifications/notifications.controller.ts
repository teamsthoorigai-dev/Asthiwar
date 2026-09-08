import { Request, Response, NextFunction } from 'express';
import {
  sendEstimateQuotationNotification,
  sendAdminNewLeadAlert,
  getNotificationLogs,
  resendNotification,
  NotificationError,
} from './notifications.service.js';

export async function sendEstimateNotificationController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const channels = req.body.channels || ['EMAIL', 'WHATSAPP'];
    const results = await sendEstimateQuotationNotification(id, channels);
    res.json({
      success: true,
      message: 'Estimate quotation dispatched successfully',
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
      message: 'Admin lead alert dispatched successfully',
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

export async function getNotificationLogsController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = {
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
      channel: req.query.channel as any,
      template: req.query.template as any,
      estimateId: req.query.estimateId as string,
      enquiryId: req.query.enquiryId as string,
    };
    const result = await getNotificationLogs(query);
    res.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function resendNotificationController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const result = await resendNotification(id);
    res.json({
      success: true,
      message: 'Notification resent successfully',
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

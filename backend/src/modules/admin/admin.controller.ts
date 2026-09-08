import { Request, Response, NextFunction } from 'express';
import {
  getAdminEnquiries,
  getAdminEnquiryById,
  updateAdminEnquiry,
  getAdminEstimates,
  getAdminEstimateById,
  updateAdminEstimate,
  getAdminDashboardAnalytics,
  AdminServiceError,
} from './admin.service.js';
import {
  EnquiriesQuery,
  UpdateEnquiryDto,
  EstimatesQuery,
  UpdateEstimateDto,
} from './admin.schema.js';

// ----------------------------------------------------
// ENQUIRIES CONTROLLER
// ----------------------------------------------------

export async function getEnquiriesController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.query as unknown as EnquiriesQuery;
    const result = await getAdminEnquiries(query);
    res.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function getEnquiryByIdController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const enquiry = await getAdminEnquiryById(id);
    res.json({
      success: true,
      data: enquiry,
    });
  } catch (error) {
    if (error instanceof AdminServiceError) {
      res.status(error.statusCode).json({
        success: false,
        error: { code: error.code, message: error.message },
      });
      return;
    }
    next(error);
  }
}

export async function updateEnquiryController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const dto = req.body as UpdateEnquiryDto;
    const updated = await updateAdminEnquiry(id, dto);
    res.json({
      success: true,
      message: 'Enquiry updated successfully',
      data: updated,
    });
  } catch (error) {
    if (error instanceof AdminServiceError) {
      res.status(error.statusCode).json({
        success: false,
        error: { code: error.code, message: error.message },
      });
      return;
    }
    next(error);
  }
}

// ----------------------------------------------------
// ESTIMATES CONTROLLER
// ----------------------------------------------------

export async function getEstimatesController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.query as unknown as EstimatesQuery;
    const result = await getAdminEstimates(query);
    res.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function getEstimateByIdController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const estimate = await getAdminEstimateById(id);
    res.json({
      success: true,
      data: estimate,
    });
  } catch (error) {
    if (error instanceof AdminServiceError) {
      res.status(error.statusCode).json({
        success: false,
        error: { code: error.code, message: error.message },
      });
      return;
    }
    next(error);
  }
}

export async function updateEstimateController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const dto = req.body as UpdateEstimateDto;
    const updated = await updateAdminEstimate(id, dto);
    res.json({
      success: true,
      message: 'Estimate updated successfully',
      data: updated,
    });
  } catch (error) {
    if (error instanceof AdminServiceError) {
      res.status(error.statusCode).json({
        success: false,
        error: { code: error.code, message: error.message },
      });
      return;
    }
    next(error);
  }
}

export async function getDashboardAnalyticsController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const analytics = await getAdminDashboardAnalytics();
    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
}

// ----------------------------------------------------
// AUDIT LOGS CONTROLLER
// ----------------------------------------------------

import { queryAuditLogs } from '../../services/audit.service.js';

export async function getAuditLogsController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const filters = {
      eventType: req.query.eventType as string | undefined,
      action: req.query.action as string | undefined,
      severity: req.query.severity as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
    };

    const result = await queryAuditLogs(filters);
    res.json({
      success: true,
      data: result.items,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
}

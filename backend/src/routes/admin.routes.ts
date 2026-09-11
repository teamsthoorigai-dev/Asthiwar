import { Router } from 'express';
import { requireAdminAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import {
  enquiriesQuerySchema,
  updateEnquirySchema,
  estimatesQuerySchema,
  updateEstimateSchema,
  auditLogsQuerySchema,
} from '../modules/admin/admin.schema.js';
import {
  getEnquiriesController,
  getEnquiryByIdController,
  updateEnquiryController,
  getEstimatesController,
  getEstimateByIdController,
  updateEstimateController,
  getDashboardAnalyticsController,
  getAuditLogsController,
  getAuditLogByIdController,
} from '../modules/admin/admin.controller.js';

const router = Router();

// Apply requireAdminAuth guard across all admin management endpoints
router.use(requireAdminAuth);

import {
  sendEstimateNotificationController,
  sendLeadNotificationController,
} from '../modules/notifications/notifications.controller.js';

// ----------------------------------------------------
// ENQUIRIES ROUTES (/api/v1/admin/enquiries)
// ----------------------------------------------------
router.get(
  '/enquiries',
  validateRequest({ query: enquiriesQuerySchema }),
  getEnquiriesController
);

router.get('/enquiries/:id', getEnquiryByIdController);

router.post('/enquiries/:id/notify', sendLeadNotificationController);

router.patch(
  '/enquiries/:id',
  validateRequest({ body: updateEnquirySchema }),
  updateEnquiryController
);

import { downloadEstimatePdfController } from '../modules/pdf/pdf.controller.js';

// ----------------------------------------------------
// ESTIMATES ROUTES (/api/v1/admin/estimates)
// ----------------------------------------------------
router.get(
  '/estimates',
  validateRequest({ query: estimatesQuerySchema }),
  getEstimatesController
);

router.get('/estimates/:id', getEstimateByIdController);

router.get('/estimates/:id/pdf', downloadEstimatePdfController);

router.post('/estimates/:id/notify', sendEstimateNotificationController);

router.patch(
  '/estimates/:id',
  validateRequest({ body: updateEstimateSchema }),
  updateEstimateController
);

// ----------------------------------------------------
// ANALYTICS ROUTES
// ----------------------------------------------------
router.get('/analytics/dashboard', getDashboardAnalyticsController);

// ----------------------------------------------------
// AUDIT LOG ROUTES (/api/v1/admin/audit-logs)
// ----------------------------------------------------
// The write side has existed since the table was created; this is the first way
// to read any of it back. Admin-only, like every route in this file.
router.get(
  '/audit-logs',
  validateRequest({ query: auditLogsQuerySchema }),
  getAuditLogsController
);

router.get('/audit-logs/:id', getAuditLogByIdController);

export default router;

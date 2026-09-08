import { Router } from 'express';
import { requireAdminAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import {
  enquiriesQuerySchema,
  updateEnquirySchema,
  estimatesQuerySchema,
  updateEstimateSchema,
} from '../modules/admin/admin.schema.js';
import {
  getEnquiriesController,
  getEnquiryByIdController,
  updateEnquiryController,
  getEstimatesController,
  getEstimateByIdController,
  updateEstimateController,
  getDashboardAnalyticsController,
} from '../modules/admin/admin.controller.js';

const router = Router();

// Apply requireAdminAuth guard across all admin management endpoints
router.use(requireAdminAuth);

import {
  sendEstimateNotificationController,
  sendLeadNotificationController,
  getNotificationLogsController,
  resendNotificationController,
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
// NOTIFICATION LOGS & RESEND (/api/v1/admin/notifications)
// ----------------------------------------------------
router.get('/notifications', getNotificationLogsController);
router.post('/notifications/:id/resend', resendNotificationController);

// ----------------------------------------------------
// ANALYTICS & AUDIT LOGS ROUTES
// ----------------------------------------------------
router.get('/analytics/dashboard', getDashboardAnalyticsController);

import { getAuditLogsController } from '../modules/admin/admin.controller.js';
router.get('/audit-logs', getAuditLogsController);

export default router;

import { Router } from 'express';
import { getHealth } from '../modules/health/health.controller.js';
import calculatorRoutes from './calculator.routes.js';
import enquiriesRoutes from './enquiries.routes.js';
import authRoutes from './auth.routes.js';
import adminRoutes from './admin.routes.js';
import adminConfigRoutes from './admin-config.routes.js';

const router = Router();

// Public Health Check Route
router.get('/health', getHealth);

// Public Calculator Routes (/api/v1/calculator/*)
router.use('/calculator', calculatorRoutes);

// Public Enquiries / Leads Route (/api/v1/enquiries)
router.use('/enquiries', enquiriesRoutes);

// Admin Authentication Routes (/api/v1/admin/auth/*)
router.use('/admin/auth', authRoutes);

// Admin Configuration & Pricing Management Routes (/api/v1/admin/config/*)
router.use('/admin/config', adminConfigRoutes);

// Admin Management & Analytics Routes (/api/v1/admin/*)
router.use('/admin', adminRoutes);

export default router;

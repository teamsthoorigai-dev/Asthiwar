import { Router } from 'express';
import {
  getLocations,
  getPackages,
  getPackageConfig,
  previewEstimate,
  createEstimate,
  getEstimateByNumber,
} from '../modules/calculator/calculator.controller.js';
import { validateRequest } from '../middleware/validate.js';
import { calculateEstimateSchema } from '../modules/calculator/calculator.schema.js';

import { downloadEstimatePdfController } from '../modules/pdf/pdf.controller.js';

const router = Router();

// GET /api/v1/calculator/locations — Active cities and price multipliers
router.get('/locations', getLocations);

// GET /api/v1/calculator/packages — 4 packages with active standard and volume rates
router.get('/packages', getPackages);

// GET /api/v1/calculator/config/:packageSlug — Full item specs & 15 add-ons for a package
router.get('/config/:packageSlug', getPackageConfig);

// POST /api/v1/calculator/preview — On-the-fly calculation preview (no DB save)
router.post('/preview', validateRequest({ body: calculateEstimateSchema }), previewEstimate);

// POST /api/v1/calculator/estimate — Authoritative calculation + Immutable DB Snapshot
router.post('/estimate', validateRequest({ body: calculateEstimateSchema }), createEstimate);

// GET /api/v1/calculator/estimate/:estimateNumber — View historical estimate snapshot
router.get('/estimate/:estimateNumber', getEstimateByNumber);

// GET /api/v1/calculator/estimate/:estimateNumber/pdf — Download/View Branded Estimate Quotation PDF
router.get('/estimate/:estimateNumber/pdf', downloadEstimatePdfController);

export default router;

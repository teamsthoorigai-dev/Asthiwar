import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  getLocations,
  getPackages,
  getPackageConfig,
  previewEstimate,
  createEstimate,
  getEstimateByNumber,
  getComparisonMatrix,
} from '../modules/calculator/calculator.controller.js';
import { validateRequest } from '../middleware/validate.js';
import { clientIp } from '../middleware/client-ip.js';
import { calculateEstimateSchema } from '../modules/calculator/calculator.schema.js';

import { downloadEstimatePdfController } from '../modules/pdf/pdf.controller.js';

const router = Router();

const tooManyRequests = (message: string) => ({
  success: false,
  error: { code: 'TOO_MANY_REQUESTS', message },
});

/**
 * The login route was carefully rate-limited. The endpoint that writes to the
 * sales pipeline was not.
 *
 * POST /estimate is unauthenticated and every call writes an estimate, its line
 * items, a CRM lead, and consumes a quotation number from a sequence that is
 * printed on customer documents. Twelve requests in a loop produced twelve of
 * each, and the console has no way to tell a real lead from a generated one.
 *
 * Ten per hour per address: a customer who redoes their configuration two or
 * three times is unaffected, and the limit is deliberately loose enough for an
 * office or a carrier NAT — Indian mobile networks put many real customers
 * behind one address, and a tight limit would turn a flood control into a lockout
 * for genuine enquiries.
 */
const estimateSubmissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => clientIp(req),
  message: tooManyRequests(
    'Too many estimates submitted from this connection. Please try again in an hour, ' +
      'or call us directly and we will prepare your quotation.'
  ),
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * The preview is debounced behind every keystroke in the configurator, so this
 * is far looser — it exists to cap a scraper walking the rate card, not to
 * ration a customer sizing their house. It writes nothing.
 */
const previewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  keyGenerator: (req) => clientIp(req),
  message: tooManyRequests('Too many pricing previews. Please wait a moment and try again.'),
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Reading a quotation back — the JSON snapshot or the PDF.
 *
 * Both were unlimited, and a PDF render is ~150 ms of CPU on the event loop.
 * Anyone can obtain a valid link by submitting one estimate, so a loop over their
 * own PDF was enough to slow every other request: twenty parallel clients took
 * /health from 3 ms to 319 ms locally. Renders are also cached (pdf.controller.ts),
 * so this mostly bounds bandwidth; the limit is far above a customer re-opening
 * their quotation.
 */
const quotationReadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  keyGenerator: (req) => clientIp(req),
  message: tooManyRequests('Too many quotation downloads. Please wait a few minutes and try again.'),
  standardHeaders: true,
  legacyHeaders: false,
});

// GET /api/v1/calculator/locations — Active cities and price multipliers
router.get('/locations', getLocations);

// GET /api/v1/calculator/packages — 4 packages with active standard and volume rates
router.get('/packages', getPackages);

// GET /api/v1/calculator/matrix — Authoritative 4-tier specification matrix from DB
router.get('/matrix', getComparisonMatrix);

// GET /api/v1/calculator/config/:packageSlug — Full item specs & 15 add-ons for a package
router.get('/config/:packageSlug', getPackageConfig);

// POST /api/v1/calculator/preview — On-the-fly calculation preview (no DB save)
router.post(
  '/preview',
  previewLimiter,
  validateRequest({ body: calculateEstimateSchema }),
  previewEstimate
);

// POST /api/v1/calculator/estimate — Authoritative calculation + Immutable DB Snapshot
router.post(
  '/estimate',
  estimateSubmissionLimiter,
  validateRequest({ body: calculateEstimateSchema }),
  createEstimate
);

// GET /api/v1/calculator/estimate/:estimateNumber — View historical estimate snapshot
router.get('/estimate/:estimateNumber', quotationReadLimiter, getEstimateByNumber);

// GET /api/v1/calculator/estimate/:estimateNumber/pdf — Download/View Branded Estimate Quotation PDF
router.get('/estimate/:estimateNumber/pdf', quotationReadLimiter, downloadEstimatePdfController);

export default router;

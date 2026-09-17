import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { createEnquiry } from '../modules/enquiries/enquiries.controller.js';
import { validateRequest } from '../middleware/validate.js';
import { clientIpKey } from '../middleware/client-ip.js';
import { createEnquirySchema } from '../modules/enquiries/enquiries.schema.js';

const router = Router();

const tooManyRequests = (message: string) => ({
  success: false,
  error: { code: 'TOO_MANY_REQUESTS', message },
});

const enquirySubmissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => clientIpKey(req),
  message: tooManyRequests(
    'Too many consultation requests submitted from this connection. Please try again in an hour, ' +
      'or contact us directly.'
  ),
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/v1/enquiries — Submit consultation lead
router.post(
  '/',
  enquirySubmissionLimiter,
  validateRequest({ body: createEnquirySchema }),
  createEnquiry
);

export default router;

import { Router } from 'express';
import { createEnquiry } from '../modules/enquiries/enquiries.controller.js';
import { validateRequest } from '../middleware/validate.js';
import { createEnquirySchema } from '../modules/enquiries/enquiries.schema.js';

const router = Router();

// POST /api/v1/enquiries — Submit consultation lead
router.post('/', validateRequest({ body: createEnquirySchema }), createEnquiry);

export default router;

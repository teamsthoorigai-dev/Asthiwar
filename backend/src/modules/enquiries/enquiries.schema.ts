import { z } from 'zod';

export const createEnquirySchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(120, 'Full name is too long'),
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number cannot exceed 15 characters')
    .regex(/^[0-9+ -]+$/, 'Invalid phone number format'),
  email: z.string().max(254).email('Invalid email address'),
  plotLocation: z.string().min(2, 'Plot location is required').max(200, 'Plot location is too long'),
  estimateNumber: z.string().max(40).optional(),
  // Links this enquiry to an estimate. Without it the estimate number is ignored:
  // numbers are a sequence, so they cannot authorise touching someone's lead.
  accessToken: z.string().max(128).optional(),
  preferredContactTime: z.string().max(100).optional(),
  // Unbounded, every submission could carry a megabyte into the database and the
  // admin alert email.
  requirementNotes: z.string().max(5000, 'Notes cannot exceed 5000 characters').optional(),
});

export type CreateEnquiryDto = z.infer<typeof createEnquirySchema>;

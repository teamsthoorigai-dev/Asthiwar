import { z } from 'zod';

export const createEnquirySchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number cannot exceed 15 characters')
    .regex(/^[0-9+ -]+$/, 'Invalid phone number format'),
  email: z.string().email('Invalid email address'),
  plotLocation: z.string().min(2, 'Plot location is required'),
  estimateNumber: z.string().optional(),
  preferredContactTime: z.string().optional(),
  requirementNotes: z.string().optional(),
});

export type CreateEnquiryDto = z.infer<typeof createEnquirySchema>;

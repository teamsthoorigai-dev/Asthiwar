import { z } from 'zod';

export const enquiryStatusEnum = z.enum([
  'NEW',
  'CONTACTED',
  'MEETING_SCHEDULED',
  'QUOTATION_SENT',
  'CLOSED_WON',
  'CLOSED_LOST',
]);

export const estimateStatusEnum = z.enum(['DRAFT', 'GENERATED', 'DOWNLOADED', 'SENT']);

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const enquiriesQuerySchema = paginationQuerySchema.extend({
  status: enquiryStatusEnum.optional(),
  plotLocation: z.string().optional(),
});

export const updateEnquirySchema = z.object({
  status: enquiryStatusEnum.optional(),
  adminNotes: z.string().max(2000, 'Admin notes cannot exceed 2000 characters').optional(),
});

export const estimatesQuerySchema = paginationQuerySchema.extend({
  status: estimateStatusEnum.optional(),
  packageSlug: z.string().optional(),
  locationId: z.coerce.number().int().optional(),
});

export const updateEstimateSchema = z.object({
  status: estimateStatusEnum.optional(),
  pdfUrl: z.string().url('Invalid PDF URL').optional().nullable(),
});

export type EnquiriesQuery = z.infer<typeof enquiriesQuerySchema>;
export type UpdateEnquiryDto = z.infer<typeof updateEnquirySchema>;
export type EstimatesQuery = z.infer<typeof estimatesQuerySchema>;
export type UpdateEstimateDto = z.infer<typeof updateEstimateSchema>;

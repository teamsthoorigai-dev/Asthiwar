import { z } from 'zod';

export const enquiryStatusEnum = z.enum([
  'NEW',
  'CONTACTED',
  'MEETING_SCHEDULED',
  'QUOTATION_SENT',
  'CLOSED_WON',
  'CLOSED_LOST',
]);

export const enquiryPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

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
  priority: enquiryPriorityEnum.optional(),
  plotLocation: z.string().optional(),
});

export const updateEnquirySchema = z.object({
  status: enquiryStatusEnum.optional(),
  priority: enquiryPriorityEnum.optional(),
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

/**
 * Audit log filters.
 *
 * `audit_logs` had three writers and no reader — every API error, admin mutation
 * and calculator submission has been recorded since the table was created, and
 * none of it could be retrieved through the product. This is the read side.
 */
export const auditLogsQuerySchema = paginationQuerySchema.extend({
  eventType: z.string().optional(),
  severity: z.string().optional(),
  actorType: z.string().optional(),
  action: z.string().optional(),
  /** ISO date-times bounding `created_at`. */
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type AuditLogsQuery = z.infer<typeof auditLogsQuerySchema>;

/**
 * The window a dashboard figure covers.
 *
 * Every KPI was all-time and nothing else was offered, so "pipeline value" was a
 * number that could only ever go up and answered no question a sales meeting
 * actually asks. `days` is the common case in one parameter; `from`/`to` cover a
 * specific period. Omitting all three keeps the all-time view.
 */
export const dashboardQuerySchema = z.object({
  days: z.coerce.number().int().positive().max(3650).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;


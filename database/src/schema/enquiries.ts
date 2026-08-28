import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { estimates } from './estimates';

export const enquiries = pgTable('enquiries', {
  id: uuid('id').defaultRandom().primaryKey(),
  estimateId: uuid('estimate_id').references(() => estimates.id, { onDelete: 'set null' }),
  estimateNumber: text('estimate_number'),
  fullName: text('full_name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  plotLocation: text('plot_location').notNull(),
  preferredContactTime: text('preferred_contact_time'),
  requirementNotes: text('requirement_notes'),
  status: text('status').default('NEW').notNull(), // 'NEW', 'CONTACTED', 'MEETING_SCHEDULED', 'QUOTATION_SENT', 'CLOSED_WON', 'CLOSED_LOST'
  adminNotes: text('admin_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

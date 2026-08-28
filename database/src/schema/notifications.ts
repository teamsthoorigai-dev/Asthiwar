import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';
import { estimates } from './estimates';
import { enquiries } from './enquiries';

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  estimateId: uuid('estimate_id').references(() => estimates.id, { onDelete: 'set null' }),
  enquiryId: uuid('enquiry_id').references(() => enquiries.id, { onDelete: 'set null' }),
  channel: text('channel').notNull(), // 'EMAIL', 'WHATSAPP', 'SMS'
  recipient: text('recipient').notNull(),
  template: text('template').notNull(), // 'ESTIMATE_QUOTATION', 'NEW_LEAD_ALERT', 'FOLLOW_UP'
  subject: text('subject'),
  payload: jsonb('payload'),
  status: text('status').default('PENDING').notNull(), // 'PENDING', 'SENT', 'FAILED'
  errorMessage: text('error_message'),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

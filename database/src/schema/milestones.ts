import { pgTable, serial, text, boolean, numeric, integer, timestamp } from 'drizzle-orm/pg-core';

export const milestoneStages = pgTable('milestone_stages', {
  id: serial('id').primaryKey(),
  stageNumber: integer('stage_number').notNull().unique(),
  stageName: text('stage_name').notNull(),
  percentage: numeric('percentage', { precision: 5, scale: 2 }).notNull(),
  keyDeliverables: text('key_deliverables').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

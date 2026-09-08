import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const healthCheckTable = pgTable('health_check', {
  id: serial('id').primaryKey(),
  status: text('status').notNull(),
  checkedAt: timestamp('checked_at', { withTimezone: true }).defaultNow().notNull(),
});

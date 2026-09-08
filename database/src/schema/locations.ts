import { pgTable, serial, text, boolean, numeric, integer, timestamp } from 'drizzle-orm/pg-core';

export const locations = pgTable('locations', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(), // e.g. Coimbatore, Pollachi, Tiruppur, Erode, Chennai
  slug: text('slug').notNull().unique(), // e.g. coimbatore, pollachi, tiruppur
  priceMultiplier: numeric('price_multiplier', { precision: 6, scale: 4 }).default('1.0000').notNull(), // e.g. 1.0000, 0.9600
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

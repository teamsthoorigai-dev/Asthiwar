import { pgTable, serial, text, boolean, numeric, integer, timestamp } from 'drizzle-orm/pg-core';

export const packages = pgTable('packages', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(), // 'basic', 'standard', 'premium', 'luxury'
  name: text('name').notNull(), // 'Basic Package', 'Standard Package', etc.
  tagline: text('tagline').notNull(), // 'Entry Level', 'Budget Friendly', etc.
  description: text('description'),
  colorTheme: text('color_theme'), // hex or design token
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const packagePrices = pgTable('package_prices', {
  id: serial('id').primaryKey(),
  packageId: integer('package_id').references(() => packages.id, { onDelete: 'cascade' }).notNull().unique(),
  pricePerSqft: numeric('price_per_sqft', { precision: 10, scale: 2 }).notNull(), // Standard rate <= 3500 sq.ft
  headRoomPricePerSqft: numeric('head_room_price_per_sqft', { precision: 10, scale: 2 }).default('0.00').notNull(),
  volumeDiscountThresholdSqft: integer('volume_discount_threshold_sqft').default(3500).notNull(),
  volumePricePerSqft: numeric('volume_price_per_sqft', { precision: 10, scale: 2 }).notNull(), // Volume rate > 3500 sq.ft
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

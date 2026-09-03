import { pgTable, serial, text, boolean, numeric, integer, timestamp } from 'drizzle-orm/pg-core';
import { packages } from './packages';

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(), // 'structure', 'design', 'management', 'kitchen', 'bathroom', 'flooring', 'doors_windows', 'painting', 'electrical', 'other'
  name: text('name').notNull(), // 'STRUCTURE', 'DESIGN', etc.
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const items = pgTable('items', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id').references(() => categories.id, { onDelete: 'cascade' }).notNull(),
  slug: text('slug').notNull().unique(), // 'steel_rebar', 'cement', 'masonry_work', 'waterproofing', etc.
  name: text('name').notNull(), // 'Steel Rebar Fe 550D', 'Cement', etc.
  description: text('description'),
  unit: text('unit').default('sqft').notNull(), // 'sqft', 'rft', 'fixed', 'item', 'allowance'
  isCustomizable: boolean('is_customizable').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const options = pgTable('options', {
  id: serial('id').primaryKey(),
  itemId: integer('item_id').references(() => items.id, { onDelete: 'cascade' }).notNull(),
  slug: text('slug').notNull(), // 'tata_steel', 'ultratech_cement', 'red_brick', etc.
  brandName: text('brand_name').notNull(), // 'JSW / TATA', 'Ultratech / Chettinad', 'Red Bricks'
  specification: text('specification'),
  isDefault: boolean('is_default').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const packageItems = pgTable('package_items', {
  id: serial('id').primaryKey(),
  packageId: integer('package_id').references(() => packages.id, { onDelete: 'cascade' }).notNull(),
  itemId: integer('item_id').references(() => items.id, { onDelete: 'cascade' }).notNull(),
  defaultOptionId: integer('default_option_id').references(() => options.id, { onDelete: 'set null' }),
  includedCoverage: text('included_coverage'), // e.g. "7 ft coverage", "Up to 15 rft", "Parryware up to ₹20,000/bath"
  isIncluded: boolean('is_included').default(true).notNull(), // false if "Additional cost" in this tier
  additionalCostPrice: numeric('additional_cost_price', { precision: 10, scale: 2 }).default('0.00').notNull(), // e.g. ₹10 for waterproofing in Basic
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const optionPrices = pgTable('option_prices', {
  id: serial('id').primaryKey(),
  optionId: integer('option_id').references(() => options.id, { onDelete: 'cascade' }).notNull(),
  packageId: integer('package_id').references(() => packages.id, { onDelete: 'cascade' }), // null if universal
  priceDelta: numeric('price_delta', { precision: 10, scale: 2 }).default('0.00').notNull(), // rate addition if selected
  priceType: text('price_type').default('per_sqft').notNull(), // 'per_sqft', 'fixed', 'per_unit'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

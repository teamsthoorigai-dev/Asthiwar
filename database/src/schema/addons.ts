import { pgTable, serial, text, boolean, numeric, integer, timestamp } from 'drizzle-orm/pg-core';

export const addons = pgTable('addons', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(), // 'overhead_concrete_tank', 'septic_tank', 'sump', 'compound_wall', etc.
  name: text('name').notNull(), // 'Overhead Concrete Tank', 'Conventional Septic Tank'
  description: text('description'),
  pricingUnit: text('pricing_unit').notNull(), // 'per_litre', 'per_rft', 'fixed', 'per_sqft_terrace', 'per_sqft_gate'
  defaultQuantity: numeric('default_quantity', { precision: 10, scale: 2 }),
  minQuantity: numeric('min_quantity', { precision: 10, scale: 2 }),
  maxQuantity: numeric('max_quantity', { precision: 10, scale: 2 }),
  sortOrder: integer('sort_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  // true when several variants may be fitted together (e.g. motor automation on
  // both the bore-water and the corporation-water tank), false for either/or.
  allowsMultiple: boolean('allows_multiple').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const addonPrices = pgTable('addon_prices', {
  id: serial('id').primaryKey(),
  addonId: integer('addon_id').references(() => addons.id, { onDelete: 'cascade' }).notNull(),
  variantName: text('variant_name').notNull(), // '3 kW', 'Fly ash brick', 'Red brick', 'MS Gate', 'SS Gate'
  variantSlug: text('variant_slug').notNull(), // '3kw', 'flyash', 'red_brick', 'ms_gate'
  packageTier: text('package_tier').default('all').notNull(), // 'all', 'basic_standard', 'premium_luxury'
  price: numeric('price', { precision: 12, scale: 2 }).notNull(), // e.g. 35.00 for ₹35/L, 180000.00 for 3kW solar
  effectiveFrom: timestamp('effective_from', { withTimezone: true }).defaultNow().notNull(),
  effectiveTo: timestamp('effective_to', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

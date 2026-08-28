import { pgTable, serial, text, numeric, integer, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';
import { packages } from './packages';
import { locations } from './locations';
import { items, options } from './specifications';
import { addons } from './addons';

export const estimates = pgTable('estimates', {
  id: uuid('id').defaultRandom().primaryKey(),
  estimateNumber: text('estimate_number').notNull().unique(), // 'EST-2026-000001'
  
  // Customer & Lead Info (Step 0)
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull(),
  customerEmail: text('customer_email'),
  plotLocation: text('plot_location').notNull(),
  locationId: integer('location_id').references(() => locations.id, { onDelete: 'set null' }),
  locationMultiplier: numeric('location_multiplier', { precision: 6, scale: 4 }).default('1.0000').notNull(),

  // Project Dimensions (Step 1 & 2)
  plotAreaSqft: numeric('plot_area_sqft', { precision: 10, scale: 2 }).notNull(),
  plotAreaUnit: text('plot_area_unit').default('sqft').notNull(),
  builtupAreaPerFloorSqft: numeric('builtup_area_per_floor_sqft', { precision: 10, scale: 2 }).notNull(),
  floorCount: text('floor_count').notNull(), // 'Ground', 'G+1', 'G+2', 'G+3'
  numberOfFloors: integer('number_of_floors').default(1).notNull(),
  floorBreakdownJson: jsonb('floor_breakdown_json'),
  carParkingAreaSqft: numeric('car_parking_area_sqft', { precision: 10, scale: 2 }).default('0.00').notNull(),
  carCount: integer('car_count').default(1).notNull(),
  totalBuiltupAreaSqft: numeric('total_builtup_area_sqft', { precision: 10, scale: 2 }).notNull(),

  // Selected Package (Step 3)
  packageId: integer('package_id').references(() => packages.id).notNull(),
  packageSlug: text('package_slug').notNull(),
  packageRatePerSqft: numeric('package_rate_per_sqft', { precision: 10, scale: 2 }).notNull(),

  // Cost Breakdown Totals
  baseConstructionCost: numeric('base_construction_cost', { precision: 12, scale: 2 }).notNull(),
  upgradesCost: numeric('upgrades_cost', { precision: 12, scale: 2 }).default('0.00').notNull(),
  addonsCost: numeric('addons_cost', { precision: 12, scale: 2 }).default('0.00').notNull(),
  subtotalCost: numeric('subtotal_cost', { precision: 12, scale: 2 }).notNull(),
  gstPercentage: numeric('gst_percentage', { precision: 4, scale: 2 }).default('0.00').notNull(),
  gstAmount: numeric('gst_amount', { precision: 12, scale: 2 }).default('0.00').notNull(),
  totalProjectCost: numeric('total_project_cost', { precision: 12, scale: 2 }).notNull(),

  // Snapshot JSON fields (Immutable)
  milestoneBreakdownJson: jsonb('milestone_breakdown_json').notNull(), // 10-stage milestone timeline
  fullSnapshotJson: jsonb('full_snapshot_json').notNull(), // Complete calculation state at time of creation

  pdfUrl: text('pdf_url'),
  status: text('status').default('DRAFT').notNull(), // 'DRAFT', 'GENERATED', 'DOWNLOADED', 'SENT'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const estimateItems = pgTable('estimate_items', {
  id: serial('id').primaryKey(),
  estimateId: uuid('estimate_id').references(() => estimates.id, { onDelete: 'cascade' }).notNull(),
  itemId: integer('item_id').references(() => items.id).notNull(),
  itemSlug: text('item_slug').notNull(),
  itemName: text('item_name').notNull(),
  selectedOptionId: integer('selected_option_id').references(() => options.id).notNull(),
  selectedOptionName: text('selected_option_name').notNull(),
  unitPriceDelta: numeric('unit_price_delta', { precision: 10, scale: 2 }).default('0.00').notNull(),
  calculatedPrice: numeric('calculated_price', { precision: 12, scale: 2 }).default('0.00').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const estimateAddons = pgTable('estimate_addons', {
  id: serial('id').primaryKey(),
  estimateId: uuid('estimate_id').references(() => estimates.id, { onDelete: 'cascade' }).notNull(),
  addonId: integer('addon_id').references(() => addons.id).notNull(),
  addonSlug: text('addon_slug').notNull(),
  addonName: text('addon_name').notNull(),
  selectedVariant: text('selected_variant').notNull(),
  quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull(),
  unit: text('unit').notNull(),
  unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
  totalPrice: numeric('total_price', { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

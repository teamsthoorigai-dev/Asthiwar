import { z } from 'zod';
import { floorsIncludingGround } from './calculator.types.js';

export const AreaUnitEnum = z.enum(['sqft', 'sqyards', 'cents', 'sqm']);
export const FloorCountEnum = z.number().int().min(0).max(10);
export const PackageSlugEnum = z.enum(['basic', 'standard', 'premium', 'luxury']);

/**
 * Upper bounds on everything a caller can send.
 *
 * None of these fields had one, so a single preview could carry tens of thousands
 * of customisations. The engine rejected them all — and the error handler then
 * wrote the whole request plus every rejection into audit_logs: one 770 KB request
 * became a 2.9 MB row and a 2 MB response. The catalogue has 24 components and 15
 * add-ons and duplicates are refused, so a genuine configuration sits far below
 * these limits.
 */
const MAX_SLUG_LENGTH = 100;
const MAX_CUSTOMIZATIONS = 100;
const MAX_ADDONS = 100;

export const customizationItemSchema = z.object({
  itemSlug: z.string().min(1, 'itemSlug is required').max(MAX_SLUG_LENGTH),
  optionSlug: z.string().min(1, 'optionSlug is required').max(MAX_SLUG_LENGTH),
});

export const addonItemSchema = z.object({
  addonSlug: z.string().min(1, 'addonSlug is required').max(MAX_SLUG_LENGTH),
  variantSlug: z.string().min(1, 'variantSlug is required').max(MAX_SLUG_LENGTH),
  quantity: z.number().positive('Quantity must be greater than 0').optional(),
});

export const calculateEstimateSchema = z.object({
  // Customer Info
  customerName: z.string().min(2, 'Customer name must be at least 2 characters').max(120, 'Customer name is too long'),
  customerPhone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number cannot exceed 15 characters')
    .regex(/^[0-9+ -]+$/, 'Invalid phone number format'),
  customerEmail: z.string().max(254).email('Invalid email address').optional().or(z.literal('')),
  plotLocation: z.string().min(2, 'Plot location is required').max(200, 'Plot location is too long'),
  locationId: z.number().int().positive().optional(),

  // Project Dimensions
  plotArea: z.number().positive('Plot area must be greater than 0'),
  plotAreaUnit: AreaUnitEnum.default('sqft'),
  builtupAreaPerFloor: z.number().positive('Built-up area per floor must be greater than 0'),
  builtupAreaUnit: AreaUnitEnum.default('sqft'),
  carParkingAreaSqft: z.number().min(0, 'Car parking area cannot be negative').default(0),
  carCount: z.number().int().min(0).max(10).default(1),

  // Floors
  floorCount: FloorCountEnum,
  // Per-floor areas, when the customer sizes each floor separately. The engine
  // sums these *instead of* multiplying the per-floor area by the floor count, so
  // an unchecked array silently overrides the floor count: `[500]` on a G+3 build
  // priced the whole house as a single 500 sq.ft slab. Length and positivity are
  // enforced in the superRefine below.
  floorBreakdown: z
    .array(z.number().positive('Each floor area must be greater than 0'))
    .max(11, 'floorBreakdown cannot have more than 11 floors')
    .optional(),
  headRoomAreaSqft: z.number().min(0, 'Head room area cannot be negative').default(0),

  // Package Selection
  packageSlug: PackageSlugEnum,

  // Optional Customizations & Add-Ons
  customizations: z
    .array(customizationItemSchema)
    .max(MAX_CUSTOMIZATIONS, `No more than ${MAX_CUSTOMIZATIONS} customizations`)
    .default([]),
  addons: z.array(addonItemSchema).max(MAX_ADDONS, `No more than ${MAX_ADDONS} add-ons`).default([]),
}).superRefine((data, ctx) => {
  if (!data.floorBreakdown || data.floorBreakdown.length === 0) return;

  const expected = floorsIncludingGround(data.floorCount);
  if (data.floorBreakdown.length !== expected) {
    const label = data.floorCount === 0 ? 'Ground' : `G+${data.floorCount}`;
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['floorBreakdown'],
      message: `floorBreakdown must give one area per floor — ${label} needs ${expected} ${
        expected === 1 ? 'entry' : 'entries'
      }, received ${data.floorBreakdown.length}`,
    });
  }
});

export type CalculateEstimateDto = z.infer<typeof calculateEstimateSchema>;

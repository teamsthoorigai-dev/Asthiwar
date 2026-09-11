import { z } from 'zod';
import { floorsIncludingGround } from './calculator.types.js';

export const AreaUnitEnum = z.enum(['sqft', 'sqyards', 'cents', 'sqm']);
export const FloorCountEnum = z.number().int().min(0).max(10);
export const PackageSlugEnum = z.enum(['basic', 'standard', 'premium', 'luxury']);

export const customizationItemSchema = z.object({
  itemSlug: z.string().min(1, 'itemSlug is required'),
  optionSlug: z.string().min(1, 'optionSlug is required'),
});

export const addonItemSchema = z.object({
  addonSlug: z.string().min(1, 'addonSlug is required'),
  variantSlug: z.string().min(1, 'variantSlug is required'),
  quantity: z.number().positive('Quantity must be greater than 0').optional(),
});

export const calculateEstimateSchema = z.object({
  // Customer Info
  customerName: z.string().min(2, 'Customer name must be at least 2 characters'),
  customerPhone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number cannot exceed 15 characters')
    .regex(/^[0-9+ -]+$/, 'Invalid phone number format'),
  customerEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  plotLocation: z.string().min(2, 'Plot location is required'),
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
  floorBreakdown: z.array(z.number().positive('Each floor area must be greater than 0')).optional(),
  headRoomAreaSqft: z.number().min(0, 'Head room area cannot be negative').default(0),

  // Package Selection
  packageSlug: PackageSlugEnum,

  // Optional Customizations & Add-Ons
  customizations: z.array(customizationItemSchema).default([]),
  addons: z.array(addonItemSchema).default([]),
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

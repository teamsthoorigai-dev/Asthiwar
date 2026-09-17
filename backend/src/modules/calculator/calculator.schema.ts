import { z } from 'zod';
import { floorsIncludingGround } from './calculator.types.js';
import { convertAreaToSqft } from './pricing-math.js';

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

/**
 * Size limits on the building itself.
 *
 * Areas had no upper bound, so 1e200 sq.ft priced at ₹4×10^203, and anything the
 * database columns could hold — up to ₹999 crore — was stored as a real lead,
 * inflating pipeline value and every average on the dashboard. The largest real
 * estimate on record is 4,700 sq.ft. These limits are measured in square feet
 * after unit conversion, and the per-field ones match what the calculator form
 * itself allows. Larger projects are quoted by the team, not the calculator.
 */
const MAX_PLOT_AREA_SQFT = 1_000_000;
const MAX_TOTAL_BUILTUP_SQFT = 100_000;
const MAX_CAR_PARKING_SQFT = 5_000;
const MAX_HEAD_ROOM_SQFT = 2_000;
// An outer bound only. The engine enforces each add-on's own maximum and explains
// it; this just keeps an absurd number from reaching the engine at all.
const MAX_ADDON_QUANTITY = 1_000_000;

export const customizationItemSchema = z.object({
  itemSlug: z.string().min(1, 'itemSlug is required').max(MAX_SLUG_LENGTH),
  optionSlug: z.string().min(1, 'optionSlug is required').max(MAX_SLUG_LENGTH),
});

export const addonItemSchema = z.object({
  addonSlug: z.string().min(1, 'addonSlug is required').max(MAX_SLUG_LENGTH),
  variantSlug: z.string().min(1, 'variantSlug is required').max(MAX_SLUG_LENGTH),
  quantity: z
    .number()
    .positive('Quantity must be greater than 0')
    .max(MAX_ADDON_QUANTITY, `Quantity cannot exceed ${MAX_ADDON_QUANTITY.toLocaleString('en-IN')}`)
    .optional(),
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
  carParkingAreaSqft: z
    .number()
    .min(0, 'Car parking area cannot be negative')
    .max(MAX_CAR_PARKING_SQFT, `Car parking area cannot exceed ${MAX_CAR_PARKING_SQFT.toLocaleString('en-IN')} sq.ft`)
    .default(0),
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
  headRoomAreaSqft: z
    .number()
    .min(0, 'Head room area cannot be negative')
    .max(MAX_HEAD_ROOM_SQFT, `Head room area cannot exceed ${MAX_HEAD_ROOM_SQFT.toLocaleString('en-IN')} sq.ft`)
    .default(0),

  // Package Selection
  packageSlug: PackageSlugEnum,

  // Optional Customizations & Add-Ons
  customizations: z
    .array(customizationItemSchema)
    .max(MAX_CUSTOMIZATIONS, `No more than ${MAX_CUSTOMIZATIONS} customizations`)
    .default([]),
  addons: z.array(addonItemSchema).max(MAX_ADDONS, `No more than ${MAX_ADDONS} add-ons`).default([]),
}).superRefine((data, ctx) => {
  if (convertAreaToSqft(data.plotArea, data.plotAreaUnit) > MAX_PLOT_AREA_SQFT) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['plotArea'],
      message: `Plot area cannot exceed ${MAX_PLOT_AREA_SQFT.toLocaleString('en-IN')} sq.ft. Please contact us for a project this size.`,
    });
  }

  // The same total the engine charges over: every floor, plus car parking.
  const floorsSqft =
    data.floorBreakdown && data.floorBreakdown.length > 0
      ? data.floorBreakdown.reduce((sum, area) => sum + convertAreaToSqft(area, data.builtupAreaUnit), 0)
      : convertAreaToSqft(data.builtupAreaPerFloor, data.builtupAreaUnit) *
        floorsIncludingGround(data.floorCount);
  if (floorsSqft + data.carParkingAreaSqft > MAX_TOTAL_BUILTUP_SQFT) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [data.floorBreakdown && data.floorBreakdown.length > 0 ? 'floorBreakdown' : 'builtupAreaPerFloor'],
      message: `Total built-up area cannot exceed ${MAX_TOTAL_BUILTUP_SQFT.toLocaleString('en-IN')} sq.ft. Please contact us for a project this size.`,
    });
  }

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

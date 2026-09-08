import { z } from 'zod';

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
  floorBreakdown: z.array(z.number()).optional(),
  headRoomAreaSqft: z.number().min(0, 'Head room area cannot be negative').default(0),

  // Package Selection
  packageSlug: PackageSlugEnum,

  // Optional Customizations & Add-Ons
  customizations: z.array(customizationItemSchema).default([]),
  addons: z.array(addonItemSchema).default([]),
});

export type CalculateEstimateDto = z.infer<typeof calculateEstimateSchema>;

import { z } from 'zod';

export const updatePackagePriceSchema = z
  .object({
    pricePerSqft: z.coerce.number().positive('Standard price per sqft must be positive'),
    volumePricePerSqft: z.coerce.number().positive('Volume price per sqft must be positive'),
    volumeDiscountThresholdSqft: z.coerce.number().int().positive().default(3500),
    headRoomPricePerSqft: z.coerce.number().nonnegative().optional(),
  })
  .superRefine((data, ctx) => {
    // The volume rate is a discount for building bigger. Above the standard rate
    // it is the opposite: crossing the threshold makes the quote jump rather than
    // ease, and by a multiple — a mistyped 9999 against a 2000 standard rate
    // quoted a 4,000 sq.ft build at Rs 3.99 crore, live, with no warning.
    //
    // Equal is allowed: a tier that offers no volume discount is a pricing
    // decision, not a mistake.
    if (data.volumePricePerSqft > data.pricePerSqft) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['volumePricePerSqft'],
        message:
          `The volume rate (Rs ${data.volumePricePerSqft}/sq.ft) is above the standard rate ` +
          `(Rs ${data.pricePerSqft}/sq.ft), so crossing the threshold would raise the price ` +
          'rather than discount it. Set it at or below the standard rate.',
      });
    }
  });

export const updatePackageMetadataSchema = z.object({
  name: z.string().min(2).optional(),
  tagline: z.string().min(2).optional(),
  description: z.string().optional(),
  highlights: z.array(z.string()).optional(),
  isRecommended: z.boolean().optional(),
  colorTheme: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export const createLocationSchema = z.object({
  name: z.string().min(2, 'City name is required'),
  slug: z.string().min(2, 'Slug is required').regex(/^[a-z0-9_]+$/, 'Slug must be lowercase alphanumeric with underscores'),
  priceMultiplier: z.coerce.number().min(0.5).max(2.0, 'Multiplier must be between 0.5 and 2.0'),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const updateLocationSchema = z.object({
  name: z.string().min(2).optional(),
  priceMultiplier: z.coerce.number().min(0.5).max(2.0).optional(),
  sortOrder: z.coerce.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const updateAddonPriceSchema = z.object({
  variantSlug: z.string().min(1, 'Variant slug is required'),
  price: z.coerce.number().min(0, 'Price must be non-negative'),
});

const slugField = z
  .string()
  .min(2, 'Slug is required')
  .regex(/^[a-z0-9_]+$/, 'Slug must be lowercase alphanumeric with underscores');

/** The pricing units the calculator knows how to render and multiply. */
export const ADDON_PRICING_UNITS = [
  'fixed',
  'per_litre',
  'per_rft',
  'per_sqft',
  'per_sqft_gate',
  'per_sqft_terrace',
] as const;

export const addonVariantItemSchema = z.object({
  variantName: z.string().min(1, 'Variant name is required'),
  variantSlug: slugField,
  price: z.coerce.number().min(0, 'Price must be non-negative'),
  // Which package tiers the variant is offered in, by package slug. Validated
  // against the live catalogue in the service, then collapsed to the stored
  // `package_tier` encoding (see services/addon-tiers.ts).
  packageTiers: z
    .array(z.string().min(1))
    .min(1, 'Select at least one package this variant is available in'),
});

/**
 * Quantity bounds have to be satisfiable by the quantity the calculator opens at.
 *
 * The engine enforces min/max and refuses anything outside them, so a default
 * sitting outside its own bounds produces an add-on that is rejected the instant
 * a customer ticks it — configured in the console, broken on the site, with
 * nothing linking the two. Checked on create and on edit alike.
 */
function refineQuantityBounds(
  data: { defaultQuantity?: number | null; minQuantity?: number | null; maxQuantity?: number | null },
  ctx: z.RefinementCtx
): void {
  const min = data.minQuantity ?? null;
  const max = data.maxQuantity ?? null;
  const def = data.defaultQuantity ?? null;

  if (min !== null && max !== null && min > max) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['minQuantity'],
      message: `Minimum quantity (${min}) cannot exceed the maximum (${max}).`,
    });
  }

  if (def !== null && min !== null && def < min) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['defaultQuantity'],
      message: `Default quantity (${def}) is below the minimum (${min}), so the add-on could never be selected.`,
    });
  }

  if (def !== null && max !== null && def > max) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['defaultQuantity'],
      message: `Default quantity (${def}) is above the maximum (${max}), so the add-on could never be selected.`,
    });
  }
}

export const createAddonSchema = z
  .object({
    name: z.string().min(2, 'Add-on name is required'),
    slug: slugField,
    description: z.string().optional(),
    pricingUnit: z.enum(ADDON_PRICING_UNITS),
    defaultQuantity: z.coerce.number().min(0).optional(),
    minQuantity: z.coerce.number().min(0).optional(),
    maxQuantity: z.coerce.number().min(0).optional(),
    sortOrder: z.coerce.number().int().default(0),
    allowsMultiple: z.boolean().default(false),
    isActive: z.boolean().default(true),
    // At least one variant, so a freshly created add-on is immediately priceable
    // in the calculator instead of rendering with no selectable rate.
    variants: z.array(addonVariantItemSchema).min(1, 'At least one price variant is required'),
  })
  .superRefine(refineQuantityBounds);

export const updateAddonMetadataSchema = z
  .object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    pricingUnit: z.enum(ADDON_PRICING_UNITS).optional(),
    defaultQuantity: z.coerce.number().min(0).nullable().optional(),
    minQuantity: z.coerce.number().min(0).nullable().optional(),
    maxQuantity: z.coerce.number().min(0).nullable().optional(),
    allowsMultiple: z.boolean().optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.coerce.number().int().optional(),
  })
  .superRefine(refineQuantityBounds);

export const createAddonVariantSchema = addonVariantItemSchema;

export const createCategorySchema = z.object({
  name: z.string().min(2, 'Category name is required'),
  slug: slugField,
  sortOrder: z.coerce.number().int().default(0),
});

export const updateCategorySchema = z.object({
  name: z.string().min(2).optional(),
  slug: slugField.optional(),
  sortOrder: z.coerce.number().int().optional(),
});

/** Units an item's price delta can be expressed in. */
export const ITEM_UNITS = ['sqft', 'rft', 'fixed', 'item', 'allowance'] as const;

export const createItemSchema = z.object({
  categoryId: z.coerce.number().int().positive('Category ID is required'),
  name: z.string().min(2, 'Component name is required'),
  slug: slugField,
  description: z.string().optional(),
  unit: z.enum(ITEM_UNITS).default('sqft'),
  isCustomizable: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export const updateItemSchema = z.object({
  categoryId: z.coerce.number().int().positive().optional(),
  name: z.string().min(2).optional(),
  slug: slugField.optional(),
  description: z.string().nullable().optional(),
  unit: z.enum(ITEM_UNITS).optional(),
  isCustomizable: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export const createOptionSchema = z.object({
  itemId: z.coerce.number().int().positive('Item ID is required'),
  name: z.string().min(1, 'Option name is required'),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  // A delta may be negative: picking standard flush doors over teak is a credit
  // against the package rate, not an upgrade. The floor here blocked that outright
  // while the per-package `prices` array below never had one — so the same value
  // was accepted or rejected depending on which field the admin console used.
  priceDelta: z.coerce.number().optional().default(0),
  prices: z.array(z.object({
    packageId: z.coerce.number().int().positive('Package ID is required'),
    priceDelta: z.coerce.number().optional().default(0),
    isComplimentary: z.boolean().optional(),
  })).optional(),
});

export const updateOptionPriceSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  // Negative is a downgrade credit — see createOptionSchema above.
  priceDelta: z.coerce.number().optional(),
  prices: z.array(z.object({
    packageId: z.coerce.number().int().positive('Package ID is required'),
    priceDelta: z.coerce.number().optional().default(0),
    isComplimentary: z.boolean().optional(),
  })).optional(),
});

export const updatePackageItemSchema = z.object({
  isIncluded: z.boolean().optional(),
  additionalCostPrice: z.coerce.number().min(0).optional(),
  includedCoverage: z.string().optional().nullable(),
  // null clears the tier's default; a number has to be a plausible id. The
  // service additionally checks it is an option of this same component.
  defaultOptionId: z.coerce.number().int().positive().optional().nullable(),
});

export const milestoneStageItemSchema = z.object({
  id: z.coerce.number().optional(),
  stageNumber: z.coerce.number().int().positive('Stage number must be a positive integer'),
  stageName: z.string().min(2, 'Stage name must be at least 2 characters'),
  percentage: z.coerce.number().positive('Percentage must be positive'),
  keyDeliverables: z.string().min(3, 'Key deliverables must be at least 3 characters'),
  isActive: z.boolean().optional().default(true),
});

export const updateMilestonesSchema = z.object({
  milestones: z
    .array(milestoneStageItemSchema)
    .min(1, 'At least one milestone stage is required')
    .superRefine((items, ctx) => {
      // stage_number is the upsert key, so two entries sharing one collapse into
      // a single row — after the 100% check below has already passed on both.
      // The saved schedule then sums to less than 100 and the last stage silently
      // absorbs the shortfall on every quotation.
      const seen = new Set<number>();
      items.forEach((item, index) => {
        if (seen.has(item.stageNumber)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [index, 'stageNumber'],
            message: `Stage number ${item.stageNumber} is used more than once. Each stage needs its own number.`,
          });
        }
        seen.add(item.stageNumber);
      });
    })
    .refine(
      (items) => {
        const sum = items
          .filter((item) => item.isActive !== false)
          .reduce((acc, curr) => acc + Number(curr.percentage), 0);
        return Math.abs(sum - 100) < 0.01;
      },
      {
        message: 'Active milestone percentages must sum to exactly 100.00%',
      }
    ),
});

export type UpdatePackagePriceDto = z.infer<typeof updatePackagePriceSchema>;
export type UpdatePackageMetadataDto = z.infer<typeof updatePackageMetadataSchema>;
export type CreateLocationDto = z.infer<typeof createLocationSchema>;
export type UpdateLocationDto = z.infer<typeof updateLocationSchema>;
export type UpdateAddonPriceDto = z.infer<typeof updateAddonPriceSchema>;
export type UpdateAddonMetadataDto = z.infer<typeof updateAddonMetadataSchema>;
export type CreateAddonDto = z.infer<typeof createAddonSchema>;
export type CreateAddonVariantDto = z.infer<typeof createAddonVariantSchema>;
export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
export type CreateItemDto = z.infer<typeof createItemSchema>;
export type UpdateItemDto = z.infer<typeof updateItemSchema>;
export type CreateOptionDto = z.infer<typeof createOptionSchema>;
export type UpdateOptionPriceDto = z.infer<typeof updateOptionPriceSchema>;
export type UpdatePackageItemDto = z.infer<typeof updatePackageItemSchema>;
export type MilestoneStageItemDto = z.infer<typeof milestoneStageItemSchema>;
export type UpdateMilestonesDto = z.infer<typeof updateMilestonesSchema>;


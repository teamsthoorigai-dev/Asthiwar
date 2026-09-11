import {
  db,
  schema,
  eq,
  ne,
  and,
  inArray,
  isNull,
  notInArray,
  desc,
  asc,
} from '@asthiwar/database';
import {
  UpdatePackagePriceDto,
  UpdatePackageMetadataDto,
  CreateLocationDto,
  UpdateLocationDto,
  UpdateAddonPriceDto,
  UpdateAddonMetadataDto,
  CreateOptionDto,
  UpdateOptionPriceDto,
  UpdatePackageItemDto,
  UpdateMilestonesDto,
  CreateAddonDto,
  CreateAddonVariantDto,
  UpdateAddonVariantDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateItemDto,
  UpdateItemDto,
} from './admin-config.schema.js';
import { AdminServiceError } from './admin.service.js';
import { serializePackageTiers } from '../../services/addon-tiers.js';

// A price row is live only while it has not been retired. Retired rows stay in the table as
// history — every read that means "the current price" has to exclude them.
//
// This has to agree with services/pricing-window.ts, which is what the calculator
// charges from — otherwise the operator is shown one rate while customers are
// quoted another. Both now mean exactly "effective_to is null", which is also the
// condition the database's partial unique indexes enforce.
const isActivePrice = (p: { effectiveTo: Date | null }) => p.effectiveTo === null;

/**
 * Saved estimates hold hard foreign keys to items, options and add-ons (no ON DELETE
 * rule), so deleting a row that a quotation already cites would fail deep in the
 * driver with an opaque 23503. These guards turn that into a 409 the operator can act
 * on, and — just as importantly — keep historical quotations readable.
 */
async function assertNoEstimateItemRefs(itemIds: number[], label: string): Promise<void> {
  if (itemIds.length === 0) return;
  const refs = await db
    .select({ id: schema.estimateItems.id })
    .from(schema.estimateItems)
    .where(inArray(schema.estimateItems.itemId, itemIds))
    .limit(1);

  if (refs.length > 0) {
    throw new AdminServiceError(
      409,
      'REFERENCED_BY_ESTIMATES',
      `${label} is used by at least one saved estimate and cannot be deleted. Rename it instead, or remove those estimates first.`
    );
  }
}

async function assertNoEstimateOptionRefs(optionIds: number[], label: string): Promise<void> {
  if (optionIds.length === 0) return;
  const refs = await db
    .select({ id: schema.estimateItems.id })
    .from(schema.estimateItems)
    .where(inArray(schema.estimateItems.selectedOptionId, optionIds))
    .limit(1);

  if (refs.length > 0) {
    throw new AdminServiceError(
      409,
      'REFERENCED_BY_ESTIMATES',
      `${label} is used by at least one saved estimate and cannot be deleted. Rename it instead, or remove those estimates first.`
    );
  }
}

async function assertNoEstimateAddonRefs(addonId: number, label: string): Promise<void> {
  const refs = await db
    .select({ id: schema.estimateAddons.id })
    .from(schema.estimateAddons)
    .where(eq(schema.estimateAddons.addonId, addonId))
    .limit(1);

  if (refs.length > 0) {
    throw new AdminServiceError(
      409,
      'REFERENCED_BY_ESTIMATES',
      `${label} is used by at least one saved estimate and cannot be deleted. Deactivate it instead to hide it from the calculator.`
    );
  }
}

/** Active package slugs in catalogue order — the roster a variant can be scoped to. */
async function getActivePackageSlugs(): Promise<string[]> {
  const rows = await db
    .select({ slug: schema.packages.slug })
    .from(schema.packages)
    .where(eq(schema.packages.isActive, true))
    .orderBy(asc(schema.packages.sortOrder));

  return Array.from(new Set(rows.map((r) => r.slug)));
}

/**
 * Zod can only check these are non-empty strings; the real catalogue lives in the
 * database, so a typo'd or retired slug is rejected here rather than being written
 * as a tier that will never match a package.
 */
function assertKnownPackageSlugs(
  slugs: readonly string[],
  catalogueSlugs: readonly string[],
  variantLabel: string
): void {
  const unknown = slugs.filter((s) => !catalogueSlugs.includes(s));
  if (unknown.length > 0) {
    throw new AdminServiceError(
      400,
      'UNKNOWN_PACKAGE_SLUG',
      `'${variantLabel}' references ${unknown.length === 1 ? 'an unknown package' : 'unknown packages'}: ${unknown.join(', ')}`
    );
  }
}

// Default fallback highlights for each package tier
const DEFAULT_PACKAGE_HIGHLIGHTS: Record<string, string[]> = {
  basic: [
    'ISI Fe 550D TMT Steel & ISI Cement',
    'Solid Concrete Blocks Masonry',
    '1 Putnam + 2 ISI Emulsion Paint',
    "2'x2' Vitrified Flooring (Rs. 45/sqft)",
    'Standard UPVC Sliding Windows',
    '10-Year Structural Warranty',
  ],
  standard: [
    'SPA / Vizag Steel & JSW / Ramco Cement',
    'Fly Ash / AAC Blocks Masonry',
    'Parryware Sanitary Fittings (Rs. 20,000/bath)',
    "4'x2' Vitrified Tiles (Rs. 50/sqft)",
    'Dr. Fixit Waterproofing Included',
    'Readymade Teak Main Door (5"x4")',
  ],
  premium: [
    'ARS / Suryadev Fe 550D & Ultratech Cement',
    'Jaquar Premium Sanitary (Rs. 30,000/bath)',
    'Granite Staircase Flooring (Rs. 120/sqft)',
    "1st Quality Teak Main Door (3.5'x7')",
    'Asian Apex Weatherproof Exterior Paint',
    'Soil Testing & Architect Site Visits Included',
  ],
  luxury: [
    'JSW / TATA Fe 550D & Ultratech Cement',
    '100% Solid Red Bricks & RCC Basement',
    'Toto / Kohler Luxury Bathrooms (Rs. 45,000/bath)',
    "1st Quality Burma Teak Doors (3.5'x8')",
    'Italian / Premium Tiles (Rs. 100/sqft)',
    'VR 3D Walkthrough & Full Dedicated Site Engineer',
  ],
};

// ----------------------------------------------------
// 1. PACKAGES CONFIGURATION & PRICE VERSIONING
// ----------------------------------------------------

export async function getAdminPackages() {
  const allPackages = await db
    .select()
    .from(schema.packages)
    .orderBy(asc(schema.packages.sortOrder));

  const allPrices = await db
    .select()
    .from(schema.packagePrices)
    .orderBy(desc(schema.packagePrices.effectiveFrom));

  const uniquePkgMap = new Map<string, any>();
  for (const pkg of allPackages) {
    if (!uniquePkgMap.has(pkg.slug)) {
      const activePrice = allPrices.find((p) => p.packageId === pkg.id && isActivePrice(p)) || null;
      uniquePkgMap.set(pkg.slug, {
        ...pkg,
        highlights: (pkg.highlights && Array.isArray(pkg.highlights) && pkg.highlights.length > 0)
          ? pkg.highlights
          : (DEFAULT_PACKAGE_HIGHLIGHTS[pkg.slug] || []),
        isRecommended: pkg.isRecommended ?? (pkg.slug === 'premium'),
        activePrice,
        priceHistory: activePrice ? [activePrice] : [],
      });
    }
  }

  return Array.from(uniquePkgMap.values());
}

export async function updateAdminPackagePrice(packageIdOrSlug: number | string, dto: UpdatePackagePriceDto) {
  const isNumeric = !isNaN(Number(packageIdOrSlug));
  const pkg = await db.query.packages.findFirst({
    where: isNumeric
      ? eq(schema.packages.id, Number(packageIdOrSlug))
      : eq(schema.packages.slug, String(packageIdOrSlug)),
  });

  if (!pkg) {
    throw new AdminServiceError(404, 'PACKAGE_NOT_FOUND', `Package '${packageIdOrSlug}' not found`);
  }

  // Version on write: retire the row in force and insert its replacement, rather
  // than editing the live row in place. `package_prices` is the rate history for a
  // package — this table holds 17 rows for Basic alone — and an UPDATE scoped only
  // by package_id restated every one of them, rewriting the rates that past
  // quotations were issued under.
  //
  // Order matters: `package_prices_active_unique` is a unique index over
  // (package_id) WHERE effective_to IS NULL, so the outgoing row has to be retired
  // before its replacement is inserted. Both run in one transaction, so a failure
  // can never leave a package with no price in force.
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(schema.packagePrices)
      .where(
        and(
          eq(schema.packagePrices.packageId, pkg.id),
          isNull(schema.packagePrices.effectiveTo)
        )
      )
      .limit(1);

    if (!current) {
      throw new AdminServiceError(
        409,
        'NO_ACTIVE_PACKAGE_PRICE',
        `'${pkg.name}' has no price row in force. Seed or restore one before repricing.`
      );
    }

    const now = new Date();

    await tx
      .update(schema.packagePrices)
      .set({ effectiveTo: now })
      .where(eq(schema.packagePrices.id, current.id));

    // A new row has to be complete, so anything the caller left out carries over
    // from the row being replaced rather than silently reverting to a default.
    const [created] = await tx
      .insert(schema.packagePrices)
      .values({
        packageId: pkg.id,
        pricePerSqft: dto.pricePerSqft.toFixed(2),
        volumePricePerSqft: dto.volumePricePerSqft.toFixed(2),
        volumeDiscountThresholdSqft: dto.volumeDiscountThresholdSqft,
        headRoomPricePerSqft:
          dto.headRoomPricePerSqft !== undefined
            ? dto.headRoomPricePerSqft.toFixed(2)
            : current.headRoomPricePerSqft,
        effectiveFrom: now,
      })
      .returning();

    return created;
  });
}

export async function updateAdminPackageMetadata(packageId: number, dto: UpdatePackageMetadataDto) {
  const pkg = await db.query.packages.findFirst({
    where: eq(schema.packages.id, packageId),
  });

  if (!pkg) {
    throw new AdminServiceError(404, 'PACKAGE_NOT_FOUND', `Package with ID ${packageId} not found`);
  }

  const [updated] = await db
    .update(schema.packages)
    .set({
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.tagline !== undefined && { tagline: dto.tagline }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.highlights !== undefined && { highlights: dto.highlights }),
      ...(dto.isRecommended !== undefined && { isRecommended: dto.isRecommended }),
      ...(dto.colorTheme !== undefined && { colorTheme: dto.colorTheme }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      updatedAt: new Date(),
    })
    .where(eq(schema.packages.id, packageId))
    .returning();

  return updated;
}

// ----------------------------------------------------
// 2. LOCATIONS CONFIGURATION
// ----------------------------------------------------

export async function getAdminLocations() {
  return db
    .select()
    .from(schema.locations)
    .orderBy(asc(schema.locations.sortOrder));
}

export async function createAdminLocation(dto: CreateLocationDto) {
  const existing = await db.query.locations.findFirst({
    where: eq(schema.locations.slug, dto.slug),
  });

  if (existing) {
    throw new AdminServiceError(409, 'LOCATION_ALREADY_EXISTS', `Location slug '${dto.slug}' already exists`);
  }

  // `locations.name` is unique too. Only the slug was checked, so a duplicate name
  // reached the driver and came back as a raw 23505 inside an HTTP 500 — an
  // operator retyping an existing city saw a server error rather than being told
  // the city already exists.
  const existingName = await db.query.locations.findFirst({
    where: eq(schema.locations.name, dto.name),
  });

  if (existingName) {
    throw new AdminServiceError(
      409,
      'LOCATION_NAME_ALREADY_EXISTS',
      `A location named '${dto.name}' already exists (slug '${existingName.slug}')`
    );
  }

  const [created] = await db
    .insert(schema.locations)
    .values({
      name: dto.name,
      slug: dto.slug,
      priceMultiplier: dto.priceMultiplier.toFixed(4),
      sortOrder: dto.sortOrder,
      isActive: dto.isActive,
    })
    .returning();

  return created;
}

export async function updateAdminLocation(locationId: number, dto: UpdateLocationDto) {
  const existing = await db.query.locations.findFirst({
    where: eq(schema.locations.id, locationId),
  });

  if (!existing) {
    throw new AdminServiceError(404, 'LOCATION_NOT_FOUND', `Location with ID ${locationId} not found`);
  }

  const [updated] = await db
    .update(schema.locations)
    .set({
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.priceMultiplier !== undefined && { priceMultiplier: dto.priceMultiplier.toFixed(4) }),
      ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      updatedAt: new Date(),
    })
    .where(eq(schema.locations.id, locationId))
    .returning();

  return updated;
}

export async function deleteAdminLocation(locationId: number) {
  const existing = await db.query.locations.findFirst({
    where: eq(schema.locations.id, locationId),
  });

  if (!existing) {
    throw new AdminServiceError(404, 'LOCATION_NOT_FOUND', `Location with ID ${locationId} not found`);
  }

  // The only delete in this file that had no reference guard.
  //
  // `estimates.location_id` is ON DELETE SET NULL, so deleting a city did not
  // fail — it quietly severed every quotation issued against that city from the
  // catalogue row that priced it. The money is unaffected (the multiplier, the
  // location name and the full snapshot are all stored on the estimate itself),
  // but the lineage is gone and the dashboard's per-city grouping falls back to
  // matching free text. Deactivating hides a city from the calculator without
  // any of that.
  const citedBy = await db
    .select({ id: schema.estimates.id })
    .from(schema.estimates)
    .where(eq(schema.estimates.locationId, locationId))
    .limit(1);

  if (citedBy.length > 0) {
    throw new AdminServiceError(
      409,
      'REFERENCED_BY_ESTIMATES',
      `'${existing.name}' priced at least one saved quotation and cannot be deleted. ` +
        'Deactivate it instead to hide it from the calculator.'
    );
  }

  await db
    .delete(schema.locations)
    .where(eq(schema.locations.id, locationId));

  return { id: locationId, name: existing.name };
}

// ----------------------------------------------------
// 3. ADDONS CONFIGURATION & PRICE VERSIONING
// ----------------------------------------------------

export async function getAdminAddons() {
  const allAddons = await db
    .select()
    .from(schema.addons)
    .orderBy(asc(schema.addons.sortOrder));

  const allPrices = await db
    .select()
    .from(schema.addonPrices)
    .orderBy(desc(schema.addonPrices.effectiveFrom));

  return allAddons.map((addon) => {
    const addonPricesList = allPrices.filter((p) => p.addonId === addon.id);
    return {
      ...addon,
      activePrices: addonPricesList.filter(isActivePrice),
      allPriceHistory: addonPricesList,
    };
  });
}

export async function updateAdminAddonPrice(addonIdOrSlug: number | string, dto: UpdateAddonPriceDto) {
  const isNumeric = !isNaN(Number(addonIdOrSlug));
  const addon = await db.query.addons.findFirst({
    where: isNumeric
      ? eq(schema.addons.id, Number(addonIdOrSlug))
      : eq(schema.addons.slug, String(addonIdOrSlug)),
  });

  if (!addon) {
    throw new AdminServiceError(404, 'ADDON_NOT_FOUND', `Addon '${addonIdOrSlug}' not found`);
  }

  // Version on write, exactly as updateAdminPackagePrice does.
  //
  // This used to be an in-place UPDATE of the live row, under a response that
  // told the operator the change had been saved "with history versioning". It had
  // not: `effective_from` was left untouched, no row was retired, and the
  // previous rate was simply gone. `addon_prices` carries the same
  // effective_from/effective_to pair as `package_prices` for the same reason —
  // an estimate issued last year has to stay explicable against the rates that
  // produced it — and a table where only one of two writers versions is a table
  // whose history cannot be trusted at all.
  //
  // Order matters: migration 0010 puts a partial unique index over
  // (addon_id, variant_slug, package_tier) WHERE effective_to IS NULL, so the
  // outgoing row has to be retired before its replacement is inserted. One
  // transaction throughout, so a failure cannot leave a variant with no price.
  return db.transaction(async (tx) => {
    const liveRows = await tx
      .select()
      .from(schema.addonPrices)
      .where(
        and(
          eq(schema.addonPrices.addonId, addon.id),
          eq(schema.addonPrices.variantSlug, dto.variantSlug),
          isNull(schema.addonPrices.effectiveTo)
        )
      );

    // A variant slug that matches nothing used to return `{ success: true }` with
    // no data and the same "updated successfully" message — a green toast in the
    // console for a write that never happened.
    if (liveRows.length === 0) {
      throw new AdminServiceError(
        404,
        'ADDON_VARIANT_NOT_FOUND',
        `'${addon.name}' has no active variant with slug '${dto.variantSlug}'.`
      );
    }

    const now = new Date();
    const created = [];

    // Normally one row. A variant offered to several package tiers under separate
    // rows is repriced across all of them, which is what the caller is asking for:
    // the endpoint identifies a variant, not a tier.
    for (const current of liveRows) {
      await tx
        .update(schema.addonPrices)
        .set({ effectiveTo: now })
        .where(eq(schema.addonPrices.id, current.id));

      const [row] = await tx
        .insert(schema.addonPrices)
        .values({
          addonId: current.addonId,
          variantName: current.variantName,
          variantSlug: current.variantSlug,
          packageTier: current.packageTier,
          price: dto.price.toFixed(2),
          effectiveFrom: now,
        })
        .returning();

      created.push(row);
    }

    return created[0];
  });
}

export async function updateAdminAddonMetadata(addonId: number, dto: UpdateAddonMetadataDto) {
  const addon = await db.query.addons.findFirst({
    where: eq(schema.addons.id, addonId),
  });

  if (!addon) {
    throw new AdminServiceError(404, 'ADDON_NOT_FOUND', `Addon with ID ${addonId} not found`);
  }

  // Quantity bounds are nullable numerics: undefined means "leave alone",
  // null means "clear it", a number has to reach the driver as a string.
  const quantity = (value: number | null | undefined) =>
    value === null ? null : value === undefined ? undefined : value.toFixed(2);

  const [updated] = await db
    .update(schema.addons)
    .set({
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.pricingUnit !== undefined && { pricingUnit: dto.pricingUnit }),
      ...(dto.defaultQuantity !== undefined && { defaultQuantity: quantity(dto.defaultQuantity) }),
      ...(dto.minQuantity !== undefined && { minQuantity: quantity(dto.minQuantity) }),
      ...(dto.maxQuantity !== undefined && { maxQuantity: quantity(dto.maxQuantity) }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.allowsMultiple !== undefined && { allowsMultiple: dto.allowsMultiple }),
      ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      updatedAt: new Date(),
    })
    .where(eq(schema.addons.id, addonId))
    .returning();

  return updated;
}

export async function createAdminAddon(dto: CreateAddonDto) {
  const existing = await db.query.addons.findFirst({
    where: eq(schema.addons.slug, dto.slug),
  });

  if (existing) {
    throw new AdminServiceError(409, 'ADDON_ALREADY_EXISTS', `Add-on slug '${dto.slug}' already exists`);
  }

  // A variant slug repeated inside one add-on would make the calculator's
  // variant map ambiguous, so reject it here rather than silently collapsing.
  const seenVariantSlugs = new Set<string>();
  for (const v of dto.variants) {
    if (seenVariantSlugs.has(v.variantSlug)) {
      throw new AdminServiceError(
        409,
        'DUPLICATE_VARIANT_SLUG',
        `Variant slug '${v.variantSlug}' is repeated. Each variant needs its own slug.`
      );
    }
    seenVariantSlugs.add(v.variantSlug);
  }

  const catalogueSlugs = await getActivePackageSlugs();
  for (const v of dto.variants) {
    assertKnownPackageSlugs(v.packageTiers, catalogueSlugs, v.variantName);
  }

  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(schema.addons)
      .values({
        name: dto.name,
        slug: dto.slug,
        description: dto.description || null,
        pricingUnit: dto.pricingUnit,
        defaultQuantity: dto.defaultQuantity !== undefined ? dto.defaultQuantity.toFixed(2) : null,
        minQuantity: dto.minQuantity !== undefined ? dto.minQuantity.toFixed(2) : null,
        maxQuantity: dto.maxQuantity !== undefined ? dto.maxQuantity.toFixed(2) : null,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      })
      .returning();

    const createdPrices = await tx
      .insert(schema.addonPrices)
      .values(
        dto.variants.map((v) => ({
          addonId: created.id,
          variantName: v.variantName,
          variantSlug: v.variantSlug,
          packageTier: serializePackageTiers(v.packageTiers, catalogueSlugs),
          price: v.price.toFixed(2),
        }))
      )
      .returning();

    return { ...created, activePrices: createdPrices, allPriceHistory: createdPrices };
  });
}

export async function deleteAdminAddon(addonId: number) {
  const addon = await db.query.addons.findFirst({
    where: eq(schema.addons.id, addonId),
  });

  if (!addon) {
    throw new AdminServiceError(404, 'ADDON_NOT_FOUND', `Addon with ID ${addonId} not found`);
  }

  await assertNoEstimateAddonRefs(addonId, `Add-on '${addon.name}'`);

  // addon_prices cascades from addons, but deleting explicitly keeps the
  // intent visible and does not rely on the migration having the rule.
  await db.delete(schema.addonPrices).where(eq(schema.addonPrices.addonId, addonId));
  await db.delete(schema.addons).where(eq(schema.addons.id, addonId));

  return { id: addonId, name: addon.name };
}

export async function createAdminAddonVariant(addonId: number, dto: CreateAddonVariantDto) {
  const addon = await db.query.addons.findFirst({
    where: eq(schema.addons.id, addonId),
  });

  if (!addon) {
    throw new AdminServiceError(404, 'ADDON_NOT_FOUND', `Addon with ID ${addonId} not found`);
  }

  const clash = await db
    .select({ id: schema.addonPrices.id })
    .from(schema.addonPrices)
    .where(
      and(
        eq(schema.addonPrices.addonId, addonId),
        eq(schema.addonPrices.variantSlug, dto.variantSlug),
        isNull(schema.addonPrices.effectiveTo)
      )
    )
    .limit(1);

  if (clash.length > 0) {
    throw new AdminServiceError(
      409,
      'VARIANT_ALREADY_EXISTS',
      `'${addon.name}' already has an active variant with slug '${dto.variantSlug}'`
    );
  }

  const catalogueSlugs = await getActivePackageSlugs();
  assertKnownPackageSlugs(dto.packageTiers, catalogueSlugs, dto.variantName);

  const [created] = await db
    .insert(schema.addonPrices)
    .values({
      addonId,
      variantName: dto.variantName,
      variantSlug: dto.variantSlug,
      packageTier: serializePackageTiers(dto.packageTiers, catalogueSlugs),
      price: dto.price.toFixed(2),
    })
    .returning();

  return created;
}

export async function updateAdminAddonVariant(
  addonId: number,
  variantId: number,
  dto: UpdateAddonVariantDto
) {
  const variant = await db.query.addonPrices.findFirst({
    where: and(eq(schema.addonPrices.id, variantId), eq(schema.addonPrices.addonId, addonId)),
  });

  if (!variant) {
    throw new AdminServiceError(
      404,
      'VARIANT_NOT_FOUND',
      `Variant with ID ${variantId} not found on add-on ${addonId}`
    );
  }

  const addon = await db.query.addons.findFirst({
    where: eq(schema.addons.id, addonId),
  });
  if (!addon) {
    throw new AdminServiceError(404, 'ADDON_NOT_FOUND', `Addon with ID ${addonId} not found`);
  }

  if (dto.variantSlug && dto.variantSlug !== variant.variantSlug) {
    const clash = await db
      .select({ id: schema.addonPrices.id })
      .from(schema.addonPrices)
      .where(
        and(
          eq(schema.addonPrices.addonId, addonId),
          eq(schema.addonPrices.variantSlug, dto.variantSlug),
          ne(schema.addonPrices.id, variantId),
          isNull(schema.addonPrices.effectiveTo)
        )
      )
      .limit(1);

    if (clash.length > 0) {
      throw new AdminServiceError(
        409,
        'VARIANT_ALREADY_EXISTS',
        `'${addon.name}' already has an active variant with slug '${dto.variantSlug}'`
      );
    }
  }

  let serializedTier = variant.packageTier;
  if (dto.packageTiers && dto.packageTiers.length > 0) {
    const catalogueSlugs = await getActivePackageSlugs();
    assertKnownPackageSlugs(dto.packageTiers, catalogueSlugs, dto.variantName || variant.variantName);
    serializedTier = serializePackageTiers(dto.packageTiers, catalogueSlugs);
  }

  const nextName = dto.variantName !== undefined ? dto.variantName : variant.variantName;
  const nextSlug = dto.variantSlug !== undefined ? dto.variantSlug : variant.variantSlug;
  const priceChanged =
    dto.price !== undefined && Number(dto.price).toFixed(2) !== Number(variant.price).toFixed(2);

  if (priceChanged) {
    return db.transaction(async (tx) => {
      const now = new Date();
      await tx
        .update(schema.addonPrices)
        .set({ effectiveTo: now })
        .where(eq(schema.addonPrices.id, variantId));

      const [created] = await tx
        .insert(schema.addonPrices)
        .values({
          addonId,
          variantName: nextName,
          variantSlug: nextSlug,
          packageTier: serializedTier,
          price: dto.price!.toFixed(2),
          effectiveFrom: now,
        })
        .returning();

      return created;
    });
  }

  const [updated] = await db
    .update(schema.addonPrices)
    .set({
      ...(dto.variantName !== undefined && { variantName: dto.variantName }),
      ...(dto.variantSlug !== undefined && { variantSlug: dto.variantSlug }),
      ...(dto.packageTiers !== undefined && { packageTier: serializedTier }),
    })
    .where(eq(schema.addonPrices.id, variantId))
    .returning();

  return updated;
}

export async function deleteAdminAddonVariant(addonId: number, variantId: number) {
  const variant = await db.query.addonPrices.findFirst({
    where: and(eq(schema.addonPrices.id, variantId), eq(schema.addonPrices.addonId, addonId)),
  });

  if (!variant) {
    throw new AdminServiceError(
      404,
      'VARIANT_NOT_FOUND',
      `Variant with ID ${variantId} not found on add-on ${addonId}`
    );
  }

  // An add-on with no price rows renders in the calculator with nothing to
  // pick, so the last one has to go with the add-on itself.
  const siblings = await db
    .select({ id: schema.addonPrices.id })
    .from(schema.addonPrices)
    .where(and(eq(schema.addonPrices.addonId, addonId), isNull(schema.addonPrices.effectiveTo)));

  if (siblings.length <= 1) {
    throw new AdminServiceError(
      409,
      'LAST_VARIANT',
      'An add-on must keep at least one price variant. Delete the whole add-on instead.'
    );
  }

  await db.delete(schema.addonPrices).where(eq(schema.addonPrices.id, variantId));

  return { id: variantId, name: variant.variantName };
}

// ----------------------------------------------------
// 4. SPECIFICATIONS & OPTION PRICING
// ----------------------------------------------------

export async function getAdminSpecifications() {
  const categoriesList = await db
    .select()
    .from(schema.categories)
    .orderBy(asc(schema.categories.sortOrder));

  const itemsList = await db
    .select()
    .from(schema.items)
    .orderBy(asc(schema.items.sortOrder));

  const optionsList = await db
    .select()
    .from(schema.options);

  const optionPricesList = await db
    .select()
    .from(schema.optionPrices)
    .orderBy(desc(schema.optionPrices.effectiveFrom));

  const packageItemsList = await db
    .select()
    .from(schema.packageItems);

  return categoriesList.map((cat) => {
    const catItems = itemsList
      .filter((item) => item.categoryId === cat.id)
      .map((item) => {
        const itemOptions = optionsList
          .filter((opt) => opt.itemId === item.id)
          .map((opt) => ({
            ...opt,
            prices: optionPricesList.filter((p) => p.optionId === opt.id),
            activePrice: optionPricesList.find((p) => p.optionId === opt.id && isActivePrice(p)) || null,
          }));

        const itemPackageMappings = packageItemsList.filter((pi) => pi.itemId === item.id);

        return {
          ...item,
          options: itemOptions,
          packageMappings: itemPackageMappings,
        };
      });

    return {
      ...cat,
      items: catItems,
    };
  });
}

export async function createAdminCategory(dto: CreateCategoryDto) {
  const existing = await db.query.categories.findFirst({
    where: eq(schema.categories.slug, dto.slug),
  });

  if (existing) {
    throw new AdminServiceError(
      409,
      'CATEGORY_ALREADY_EXISTS',
      `Category slug '${dto.slug}' already exists`
    );
  }

  const [created] = await db
    .insert(schema.categories)
    .values({ name: dto.name, slug: dto.slug, sortOrder: dto.sortOrder })
    .returning();

  return { ...created, items: [] };
}

export async function updateAdminCategory(categoryId: number, dto: UpdateCategoryDto) {
  const existing = await db.query.categories.findFirst({
    where: eq(schema.categories.id, categoryId),
  });

  if (!existing) {
    throw new AdminServiceError(
      404,
      'CATEGORY_NOT_FOUND',
      `Category with ID ${categoryId} not found`
    );
  }

  if (dto.slug && dto.slug !== existing.slug) {
    const clash = await db.query.categories.findFirst({
      where: eq(schema.categories.slug, dto.slug),
    });
    if (clash) {
      throw new AdminServiceError(
        409,
        'CATEGORY_ALREADY_EXISTS',
        `Category slug '${dto.slug}' already exists`
      );
    }
  }

  const [updated] = await db
    .update(schema.categories)
    .set({
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.slug !== undefined && { slug: dto.slug }),
      ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
    })
    .where(eq(schema.categories.id, categoryId))
    .returning();

  return updated;
}

export async function deleteAdminCategory(categoryId: number) {
  const existing = await db.query.categories.findFirst({
    where: eq(schema.categories.id, categoryId),
  });

  if (!existing) {
    throw new AdminServiceError(
      404,
      'CATEGORY_NOT_FOUND',
      `Category with ID ${categoryId} not found`
    );
  }

  // items cascade from categories and options cascade from items, so the whole
  // subtree has to clear the estimate guards before any of it is removed.
  const childItems = await db
    .select({ id: schema.items.id })
    .from(schema.items)
    .where(eq(schema.items.categoryId, categoryId));
  const childItemIds = childItems.map((i) => i.id);

  await assertNoEstimateItemRefs(childItemIds, `Category '${existing.name}'`);

  const childOptions = childItemIds.length
    ? await db
        .select({ id: schema.options.id })
        .from(schema.options)
        .where(inArray(schema.options.itemId, childItemIds))
    : [];

  await assertNoEstimateOptionRefs(
    childOptions.map((o) => o.id),
    `Category '${existing.name}'`
  );

  await db.transaction(async (tx) => {
    if (childOptions.length > 0) {
      await tx.delete(schema.optionPrices).where(
        inArray(
          schema.optionPrices.optionId,
          childOptions.map((o) => o.id)
        )
      );
    }
    if (childItemIds.length > 0) {
      await tx.delete(schema.options).where(inArray(schema.options.itemId, childItemIds));
      await tx.delete(schema.packageItems).where(inArray(schema.packageItems.itemId, childItemIds));
      await tx.delete(schema.items).where(inArray(schema.items.id, childItemIds));
    }
    await tx.delete(schema.categories).where(eq(schema.categories.id, categoryId));
  });

  return { id: categoryId, name: existing.name, deletedItems: childItemIds.length };
}

export async function createAdminItem(dto: CreateItemDto) {
  const category = await db.query.categories.findFirst({
    where: eq(schema.categories.id, dto.categoryId),
  });

  if (!category) {
    throw new AdminServiceError(
      404,
      'CATEGORY_NOT_FOUND',
      `Category with ID ${dto.categoryId} not found`
    );
  }

  const existing = await db.query.items.findFirst({
    where: eq(schema.items.slug, dto.slug),
  });

  if (existing) {
    throw new AdminServiceError(
      409,
      'ITEM_ALREADY_EXISTS',
      `Component slug '${dto.slug}' already exists`
    );
  }

  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(schema.items)
      .values({
        categoryId: dto.categoryId,
        name: dto.name,
        slug: dto.slug,
        description: dto.description || null,
        unit: dto.unit,
        isCustomizable: dto.isCustomizable,
        sortOrder: dto.sortOrder,
      })
      .returning();

    // Mirror createAdminOption: give every active tier a package_items row up
    // front, so the comparison matrix and the per-package config both resolve
    // the new component instead of falling through to a null join.
    const activePkgs = await tx.query.packages.findMany({
      where: eq(schema.packages.isActive, true),
    });

    if (activePkgs.length > 0) {
      await tx.insert(schema.packageItems).values(
        activePkgs.map((pkg) => ({
          packageId: pkg.id,
          itemId: created.id,
          defaultOptionId: null,
          includedCoverage: null,
          isIncluded: true,
          additionalCostPrice: '0.00',
        }))
      );
    }

    return { ...created, options: [], packageMappings: [] };
  });
}

export async function updateAdminItem(itemId: number, dto: UpdateItemDto) {
  const existing = await db.query.items.findFirst({
    where: eq(schema.items.id, itemId),
  });

  if (!existing) {
    throw new AdminServiceError(404, 'ITEM_NOT_FOUND', `Component with ID ${itemId} not found`);
  }

  if (dto.slug && dto.slug !== existing.slug) {
    const clash = await db.query.items.findFirst({
      where: eq(schema.items.slug, dto.slug),
    });
    if (clash) {
      throw new AdminServiceError(
        409,
        'ITEM_ALREADY_EXISTS',
        `Component slug '${dto.slug}' already exists`
      );
    }
  }

  if (dto.categoryId !== undefined && dto.categoryId !== existing.categoryId) {
    const category = await db.query.categories.findFirst({
      where: eq(schema.categories.id, dto.categoryId),
    });
    if (!category) {
      throw new AdminServiceError(
        404,
        'CATEGORY_NOT_FOUND',
        `Category with ID ${dto.categoryId} not found`
      );
    }
  }

  const [updated] = await db
    .update(schema.items)
    .set({
      ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.slug !== undefined && { slug: dto.slug }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.unit !== undefined && { unit: dto.unit }),
      ...(dto.isCustomizable !== undefined && { isCustomizable: dto.isCustomizable }),
      ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
    })
    .where(eq(schema.items.id, itemId))
    .returning();

  return updated;
}

export async function deleteAdminItem(itemId: number) {
  const existing = await db.query.items.findFirst({
    where: eq(schema.items.id, itemId),
  });

  if (!existing) {
    throw new AdminServiceError(404, 'ITEM_NOT_FOUND', `Component with ID ${itemId} not found`);
  }

  await assertNoEstimateItemRefs([itemId], `Component '${existing.name}'`);

  const childOptions = await db
    .select({ id: schema.options.id })
    .from(schema.options)
    .where(eq(schema.options.itemId, itemId));

  await assertNoEstimateOptionRefs(
    childOptions.map((o) => o.id),
    `Component '${existing.name}'`
  );

  await db.transaction(async (tx) => {
    if (childOptions.length > 0) {
      await tx.delete(schema.optionPrices).where(
        inArray(
          schema.optionPrices.optionId,
          childOptions.map((o) => o.id)
        )
      );
      await tx.delete(schema.options).where(eq(schema.options.itemId, itemId));
    }
    await tx.delete(schema.packageItems).where(eq(schema.packageItems.itemId, itemId));
    await tx.delete(schema.items).where(eq(schema.items.id, itemId));
  });

  return { id: itemId, name: existing.name, deletedOptions: childOptions.length };
}

export async function createAdminOption(dto: CreateOptionDto) {
  const item = await db.query.items.findFirst({
    where: eq(schema.items.id, dto.itemId),
  });

  if (!item) {
    throw new AdminServiceError(404, 'ITEM_NOT_FOUND', `Item with ID ${dto.itemId} not found`);
  }

  const rawSlug = (dto.slug?.trim() || dto.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')).replace(/^_+|_+$/g, '') || `opt_${Date.now()}`;

  // A component cannot hold two options under one slug.
  //
  // updateAdminOptionPrice checked this and create did not, so the console could
  // make a clash that its own edit screen then refused to fix. It is not cosmetic:
  // the calculator keys its option lookup on `${itemId}:${slug}`, so the second
  // row silently displaces the first — a customer picking one brand is priced at
  // the other's rate, with both rendered under the same name.
  const slugClash = await db.query.options.findFirst({
    where: and(eq(schema.options.itemId, dto.itemId), eq(schema.options.slug, rawSlug)),
  });

  if (slugClash) {
    throw new AdminServiceError(
      409,
      'OPTION_ALREADY_EXISTS',
      `'${item.name}' already has an option with slug '${rawSlug}'`
    );
  }

  const itemPriceType = item.unit === 'fixed' ? 'fixed' : 'per_sqft';

  // One transaction, matching createAdminAddon and createAdminItem. An option
  // written without its prices is priced at zero by the engine's fallback path —
  // a free upgrade, created by a failure nobody saw.
  return db.transaction(async (tx) => {
    const [createdOption] = await tx
      .insert(schema.options)
      .values({
        itemId: dto.itemId,
        brandName: dto.name,
        slug: rawSlug,
        specification: dto.description || '',
      })
      .returning();

    let createdPrices: any[] = [];

    if (dto.prices && dto.prices.length > 0) {
      // Deduplicate by packageId to prevent DB issues
      const priceMap = new Map();
      for (const p of dto.prices) {
        priceMap.set(p.packageId, p);
      }

      // Every packageId has to name a real package. These go straight into a
      // foreign key, so a stale or mistyped id came back as a raw 23503 wrapped
      // in an HTTP 500 rather than something the operator could act on.
      const requestedPackageIds = Array.from(priceMap.keys()) as number[];
      const knownPackages = await tx
        .select({ id: schema.packages.id })
        .from(schema.packages)
        .where(inArray(schema.packages.id, requestedPackageIds));
      const knownIds = new Set(knownPackages.map((pkg) => pkg.id));
      const unknownIds = requestedPackageIds.filter((id) => !knownIds.has(id));

      if (unknownIds.length > 0) {
        throw new AdminServiceError(
          400,
          'PACKAGE_NOT_FOUND',
          `No package with ID ${unknownIds.join(', ')}`
        );
      }

      const inserts = Array.from(priceMap.values()).map((p) => {
        const isComp = p.isComplimentary === true;
        const rawDelta = isComp ? 0 : Number(p.priceDelta);
        const deltaVal = isNaN(rawDelta) ? 0 : rawDelta;
        return {
          optionId: createdOption.id,
          packageId: p.packageId,
          priceDelta: deltaVal.toFixed(2),
          priceType: itemPriceType,
        };
      });

      createdPrices = await tx.insert(schema.optionPrices).values(inserts).returning();
    } else {
      // Default to priceDelta if provided, else 0.00 for all active packages
      const activePkgs = await tx.query.packages.findMany({
        where: eq(schema.packages.isActive, true),
      });
      const defaultDelta = (dto.priceDelta !== undefined && !isNaN(Number(dto.priceDelta)))
        ? Number(dto.priceDelta).toFixed(2)
        : '0.00';
      if (activePkgs.length > 0) {
        const inserts = activePkgs.map((pkg) => ({
          optionId: createdOption.id,
          packageId: pkg.id,
          priceDelta: defaultDelta,
          priceType: itemPriceType,
        }));
        createdPrices = await tx.insert(schema.optionPrices).values(inserts).returning();
      } else {
        const [singlePrice] = await tx.insert(schema.optionPrices).values({
          optionId: createdOption.id,
          priceDelta: defaultDelta,
          priceType: itemPriceType,
        }).returning();
        createdPrices = [singlePrice];
      }
    }

    return {
      ...createdOption,
      name: createdOption.brandName,
      activePrice: createdPrices[0] || null,
      prices: createdPrices,
    };
  });
}

export async function deleteAdminOption(optionId: number) {
  const option = await db.query.options.findFirst({
    where: eq(schema.options.id, optionId),
  });

  if (!option) {
    throw new AdminServiceError(404, 'OPTION_NOT_FOUND', `Option with ID ${optionId} not found`);
  }

  await assertNoEstimateOptionRefs([optionId], `Brand option '${option.brandName}'`);

  // package_items.default_option_id is ON DELETE SET NULL, so a tier that
  // defaulted to this option is left without one — clear it explicitly so the
  // intent is visible rather than implied by the migration.
  await db
    .update(schema.packageItems)
    .set({ defaultOptionId: null })
    .where(eq(schema.packageItems.defaultOptionId, optionId));

  await db.delete(schema.optionPrices).where(eq(schema.optionPrices.optionId, optionId));
  await db.delete(schema.options).where(eq(schema.options.id, optionId));

  return { id: optionId, name: option.brandName };
}

export async function updateAdminOptionPrice(optionId: number, dto: UpdateOptionPriceDto) {
  const option = await db.query.options.findFirst({
    where: eq(schema.options.id, optionId),
  });

  if (!option) {
    throw new AdminServiceError(404, 'OPTION_NOT_FOUND', `Option with ID ${optionId} not found`);
  }

  const parentItem = await db.query.items.findFirst({
    where: eq(schema.items.id, option.itemId),
  });
  const itemPriceType = parentItem?.unit === 'fixed' ? 'fixed' : 'per_sqft';

  // Update the option's descriptive columns if provided.
  if (dto.slug && dto.slug !== option.slug) {
    const clash = await db.query.options.findFirst({
      where: and(eq(schema.options.itemId, option.itemId), eq(schema.options.slug, dto.slug)),
    });
    if (clash) {
      throw new AdminServiceError(
        409,
        'OPTION_ALREADY_EXISTS',
        `This component already has an option with slug '${dto.slug}'`
      );
    }
  }

  if (dto.name !== undefined || dto.slug !== undefined || dto.description !== undefined) {
    await db
      .update(schema.options)
      .set({
        ...(dto.name !== undefined && { brandName: dto.name }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.description !== undefined && { specification: dto.description }),
      })
      .where(eq(schema.options.id, optionId));
  }

  // Update option prices strictly per package
  let newPrices: any[] = [];

  if (dto.prices && dto.prices.length > 0) {
    // Replace the live price set only. Retired rows are the record of what past
    // quotations were issued under and must survive a reprice.
    //
    // One transaction: the delete and the insert are a single replacement, and a
    // failure between them left the option with no price in force at all — which
    // the engine charges as zero, turning a failed edit into a free upgrade.
    newPrices = await db.transaction(async (tx) => {
      // Deduplicate by packageId
      const priceMap = new Map();
      for (const p of dto.prices!) {
        priceMap.set(p.packageId, p);
      }

      const requestedPackageIds = Array.from(priceMap.keys()) as number[];
      const knownPackages = await tx
        .select({ id: schema.packages.id })
        .from(schema.packages)
        .where(inArray(schema.packages.id, requestedPackageIds));
      const knownIds = new Set(knownPackages.map((pkg) => pkg.id));
      const unknownIds = requestedPackageIds.filter((id) => !knownIds.has(id));

      if (unknownIds.length > 0) {
        throw new AdminServiceError(
          400,
          'PACKAGE_NOT_FOUND',
          `No package with ID ${unknownIds.join(', ')}`
        );
      }

      await tx
        .delete(schema.optionPrices)
        .where(
          and(
            eq(schema.optionPrices.optionId, optionId),
            isNull(schema.optionPrices.effectiveTo)
          )
        );

      const inserts = Array.from(priceMap.values()).map((p) => {
        const isComp = p.isComplimentary === true;
        const rawDelta = isComp ? 0 : Number(p.priceDelta);
        const deltaVal = isNaN(rawDelta) ? 0 : rawDelta;
        return {
          optionId: optionId,
          packageId: p.packageId,
          priceDelta: deltaVal.toFixed(2),
          priceType: itemPriceType,
        };
      });

      return tx.insert(schema.optionPrices).values(inserts).returning();
    });
  } else if (dto.priceDelta !== undefined) {
    // A bare delta names no tier, and the specifications view it is sent from has
    // no package in scope — so it can only mean the universal row (package_id IS
    // NULL). It previously updated every row for the option: an edit intended for
    // Basic silently restated Standard, Premium and Luxury too, and rewrote
    // retired rows alongside the live one.
    const liveRows = await db
      .select({
        id: schema.optionPrices.id,
        packageId: schema.optionPrices.packageId,
      })
      .from(schema.optionPrices)
      .where(
        and(
          eq(schema.optionPrices.optionId, optionId),
          isNull(schema.optionPrices.effectiveTo)
        )
      );

    if (liveRows.length === 0) {
      // Nothing priced yet — a bare delta establishes the universal rate.
      newPrices = await db
        .insert(schema.optionPrices)
        .values({
          optionId,
          packageId: null,
          priceDelta: dto.priceDelta.toFixed(2),
          priceType: itemPriceType,
        })
        .returning();
    } else if (!liveRows.some((p) => p.packageId === null)) {
      throw new AdminServiceError(
        409,
        'OPTION_PRICED_PER_PACKAGE',
        `'${option.brandName}' is priced per package tier. Use the per-package price editor so the change lands on the tier you intend.`
      );
    } else {
      newPrices = await db
        .update(schema.optionPrices)
        .set({
          priceDelta: dto.priceDelta.toFixed(2),
        })
        .where(
          and(
            eq(schema.optionPrices.optionId, optionId),
            isNull(schema.optionPrices.packageId),
            isNull(schema.optionPrices.effectiveTo)
          )
        )
        .returning();
    }
  }

  return { id: optionId, name: dto.name || option.brandName, newPrice: newPrices[0] || null, prices: newPrices };
}

export async function updateAdminPackageItem(packageItemId: number, dto: UpdatePackageItemDto) {
  const item = await db.query.packageItems.findFirst({
    where: eq(schema.packageItems.id, packageItemId),
  });

  if (!item) {
    throw new AdminServiceError(404, 'PACKAGE_ITEM_NOT_FOUND', `Package item with ID ${packageItemId} not found`);
  }

  // The default option has to be one of *this component's* options.
  //
  // `package_items.default_option_id` only carries a foreign key to options at
  // large, so any option id in the catalogue satisfied the database — a tier's
  // default for Flooring could be set to a door. It is not a cosmetic field:
  // the calculator reads it to mark which brand is included in a tier, and the
  // public comparison matrix prints it as that tier's specification.
  if (dto.defaultOptionId !== undefined && dto.defaultOptionId !== null) {
    const option = await db.query.options.findFirst({
      where: eq(schema.options.id, dto.defaultOptionId),
    });

    if (!option) {
      throw new AdminServiceError(
        404,
        'OPTION_NOT_FOUND',
        `Option with ID ${dto.defaultOptionId} not found`
      );
    }

    if (option.itemId !== item.itemId) {
      throw new AdminServiceError(
        400,
        'OPTION_BELONGS_TO_ANOTHER_ITEM',
        `'${option.brandName}' is an option of a different component and cannot be this one's default.`
      );
    }

    // A tier's included brand has to be free in that tier.
    //
    // "Included with your package" is what the calculator prints beside this
    // option, and the price the customer is charged for it is its delta in this
    // tier — two facts that only agree while that delta is zero. Point a tier at
    // a brand that carries a delta and the same visible state means two prices:
    // leave the tile alone and it is free, click the tile that is already
    // highlighted and it is billed. On a 1,500 sq.ft Basic build, a ₹95/sq.ft
    // brand made that gap ₹1,42,500.
    //
    // The catalogue already obeys this rule — all 96 (component × tier) pairs
    // have a zero delta on their included brand, and the seed encodes it by
    // leaving the row out entirely. Nothing enforced it until now, and the
    // per-tier editor made it a one-click mistake.
    //
    // Per-tier row first, universal row (package_id IS NULL) as the fallback —
    // the same precedence the calculator charges on.
    const livePrices = await db
      .select({
        packageId: schema.optionPrices.packageId,
        priceDelta: schema.optionPrices.priceDelta,
      })
      .from(schema.optionPrices)
      .where(
        and(
          eq(schema.optionPrices.optionId, dto.defaultOptionId),
          isNull(schema.optionPrices.effectiveTo)
        )
      );

    const applicable =
      livePrices.find((row) => row.packageId === item.packageId) ??
      livePrices.find((row) => row.packageId === null);

    // No row at all means no charge — the engine's own fallback — so that is fine.
    const delta = applicable ? Number(applicable.priceDelta) : 0;

    if (delta !== 0) {
      throw new AdminServiceError(
        400,
        'INCLUDED_OPTION_IS_NOT_FREE',
        `'${option.brandName}' costs ${delta > 0 ? '+' : '−'}₹${Math.abs(delta)}/sq.ft in this package, ` +
          'so it cannot also be the brand included with it. Set its rate for this package to 0 first, ' +
          'or choose a brand that is already included.'
      );
    }
  }

  const [updated] = await db
    .update(schema.packageItems)
    .set({
      ...(dto.isIncluded !== undefined && { isIncluded: dto.isIncluded }),
      ...(dto.additionalCostPrice !== undefined && { additionalCostPrice: dto.additionalCostPrice.toFixed(2) }),
      ...(dto.includedCoverage !== undefined && { includedCoverage: dto.includedCoverage }),
      ...(dto.defaultOptionId !== undefined && { defaultOptionId: dto.defaultOptionId }),
    })
    .where(eq(schema.packageItems.id, packageItemId))
    .returning();

  return updated;
}

// ----------------------------------------------------
// 5. MILESTONES CONFIGURATION
// ----------------------------------------------------

export async function getAdminMilestones() {
  const stages = await db
    .select()
    .from(schema.milestoneStages)
    .orderBy(asc(schema.milestoneStages.stageNumber));

  return stages;
}

export async function updateAdminMilestones(dto: UpdateMilestonesDto) {
  // Use transaction to update all milestone stages atomically
  const updatedStages = await db.transaction(async (tx) => {
    // The payload is the whole schedule, not a patch: any stage the operator
    // removed in the UI must disappear here, or it would survive as a ghost row
    // and break the 100% invariant the schema just validated.
    const keptStageNumbers = dto.milestones.map((m) => m.stageNumber);
    await tx
      .delete(schema.milestoneStages)
      .where(notInArray(schema.milestoneStages.stageNumber, keptStageNumbers));

    const results = [];
    for (const m of dto.milestones) {
      const [stage] = await tx
        .insert(schema.milestoneStages)
        .values({
          stageNumber: m.stageNumber,
          stageName: m.stageName,
          percentage: m.percentage.toFixed(2),
          keyDeliverables: m.keyDeliverables,
          isActive: m.isActive ?? true,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: schema.milestoneStages.stageNumber,
          set: {
            stageName: m.stageName,
            percentage: m.percentage.toFixed(2),
            keyDeliverables: m.keyDeliverables,
            isActive: m.isActive ?? true,
            updatedAt: new Date(),
          },
        })
        .returning();
      results.push(stage);
    }
    return results;
  });

  return updatedStages.sort((a, b) => a.stageNumber - b.stageNumber);
}


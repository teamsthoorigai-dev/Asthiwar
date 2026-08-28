import {
  db,
  schema,
  eq,
  and,
  isNull,
  desc,
  asc,
} from '@asthiwar/database';
import { activePriceCondition } from '../calculator/calculator.service.js';
import {
  UpdatePackagePriceDto,
  UpdatePackageMetadataDto,
  CreateLocationDto,
  UpdateLocationDto,
  UpdateAddonPriceDto,
  UpdateAddonMetadataDto,
  UpdateOptionPriceDto,
  UpdatePackageItemDto,
  UpdateMilestonesDto,
} from './admin-config.schema.js';
import { AdminServiceError } from './admin.service.js';

// ----------------------------------------------------
// 1. PACKAGES CONFIGURATION & PRICE VERSIONING
// ----------------------------------------------------

export async function getAdminPackages() {
  const allPackages = await db
    .select()
    .from(schema.packages)
    .orderBy(asc(schema.packages.sortOrder));

  const activePrices = await db
    .select()
    .from(schema.packagePrices)
    .where(activePriceCondition(schema.packagePrices));

  const allPrices = await db
    .select()
    .from(schema.packagePrices)
    .orderBy(desc(schema.packagePrices.createdAt));

  return allPackages.map((pkg) => {
    const activePrice = activePrices.find((p) => p.packageId === pkg.id) || null;
    return {
      ...pkg,
      activePrice,
      priceHistory: allPrices.filter((p) => p.packageId === pkg.id),
    };
  });
}

export async function updateAdminPackagePrice(packageIdOrSlug: number | string, dto: UpdatePackagePriceDto) {
  const pkg = await db.query.packages.findFirst({
    where: typeof packageIdOrSlug === 'number' || !isNaN(Number(packageIdOrSlug))
      ? eq(schema.packages.id, Number(packageIdOrSlug))
      : eq(schema.packages.slug, String(packageIdOrSlug)),
  });

  if (!pkg) {
    throw new AdminServiceError(404, 'PACKAGE_NOT_FOUND', `Package '${packageIdOrSlug}' not found`);
  }

  // 1. Expire currently active price
  await db
    .update(schema.packagePrices)
    .set({ effectiveTo: new Date() })
    .where(and(eq(schema.packagePrices.packageId, pkg.id), isNull(schema.packagePrices.effectiveTo)));

  // 2. Insert new versioned price record
  const [newPrice] = await db
    .insert(schema.packagePrices)
    .values({
      packageId: pkg.id,
      pricePerSqft: dto.pricePerSqft.toFixed(2),
      volumePricePerSqft: dto.volumePricePerSqft.toFixed(2),
      volumeDiscountThresholdSqft: dto.volumeDiscountThresholdSqft,
      headRoomPricePerSqft: (dto.headRoomPricePerSqft ?? 0).toFixed(2),
      effectiveFrom: new Date(),
      effectiveTo: null,
    })
    .returning();

  return newPrice;
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

// ----------------------------------------------------
// 3. ADDONS CONFIGURATION & PRICE VERSIONING
// ----------------------------------------------------

export async function getAdminAddons() {
  const allAddons = await db
    .select()
    .from(schema.addons)
    .orderBy(asc(schema.addons.sortOrder));

  const activePrices = await db
    .select()
    .from(schema.addonPrices)
    .where(activePriceCondition(schema.addonPrices));

  const allPrices = await db
    .select()
    .from(schema.addonPrices)
    .orderBy(desc(schema.addonPrices.createdAt));

  return allAddons.map((addon) => {
    return {
      ...addon,
      activePrices: activePrices.filter((p) => p.addonId === addon.id),
      allPriceHistory: allPrices.filter((p) => p.addonId === addon.id),
    };
  });
}

export async function updateAdminAddonPrice(addonIdOrSlug: number | string, dto: UpdateAddonPriceDto) {
  const addon = await db.query.addons.findFirst({
    where: typeof addonIdOrSlug === 'number' || !isNaN(Number(addonIdOrSlug))
      ? eq(schema.addons.id, Number(addonIdOrSlug))
      : eq(schema.addons.slug, String(addonIdOrSlug)),
  });

  if (!addon) {
    throw new AdminServiceError(404, 'ADDON_NOT_FOUND', `Addon '${addonIdOrSlug}' not found`);
  }

  const existingPrice = await db.query.addonPrices.findFirst({
    where: and(
      eq(schema.addonPrices.addonId, addon.id),
      eq(schema.addonPrices.variantSlug, dto.variantSlug),
      isNull(schema.addonPrices.effectiveTo)
    ),
  });

  // 1. Expire currently active price
  await db
    .update(schema.addonPrices)
    .set({ effectiveTo: new Date() })
    .where(
      and(
        eq(schema.addonPrices.addonId, addon.id),
        eq(schema.addonPrices.variantSlug, dto.variantSlug),
        isNull(schema.addonPrices.effectiveTo)
      )
    );

  // 2. Insert new versioned price record
  const [updatedPrice] = await db
    .insert(schema.addonPrices)
    .values({
      addonId: addon.id,
      variantName: existingPrice?.variantName || dto.variantSlug,
      variantSlug: dto.variantSlug,
      packageTier: existingPrice?.packageTier || 'all',
      price: dto.price.toFixed(2),
      effectiveFrom: new Date(),
      effectiveTo: null,
    })
    .returning();

  return updatedPrice;
}

export async function updateAdminAddonMetadata(addonId: number, dto: UpdateAddonMetadataDto) {
  const addon = await db.query.addons.findFirst({
    where: eq(schema.addons.id, addonId),
  });

  if (!addon) {
    throw new AdminServiceError(404, 'ADDON_NOT_FOUND', `Addon with ID ${addonId} not found`);
  }

  const [updated] = await db
    .update(schema.addons)
    .set({
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      updatedAt: new Date(),
    })
    .where(eq(schema.addons.id, addonId))
    .returning();

  return updated;
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

  const activeOptionPricesList = await db
    .select()
    .from(schema.optionPrices)
    .where(activePriceCondition(schema.optionPrices));

  const optionPricesList = await db
    .select()
    .from(schema.optionPrices)
    .orderBy(desc(schema.optionPrices.createdAt));

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
            activePrice: activeOptionPricesList.find((p) => p.optionId === opt.id) || null,
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

export async function updateAdminOptionPrice(optionId: number, dto: UpdateOptionPriceDto) {
  const option = await db.query.options.findFirst({
    where: eq(schema.options.id, optionId),
  });

  if (!option) {
    throw new AdminServiceError(404, 'OPTION_NOT_FOUND', `Option with ID ${optionId} not found`);
  }

  const existingPrice = await db.query.optionPrices.findFirst({
    where: and(
      eq(schema.optionPrices.optionId, optionId),
      isNull(schema.optionPrices.effectiveTo)
    ),
  });

  // 1. Expire currently active option price
  await db
    .update(schema.optionPrices)
    .set({ effectiveTo: new Date() })
    .where(and(eq(schema.optionPrices.optionId, optionId), isNull(schema.optionPrices.effectiveTo)));

  // 2. Insert new versioned option price record
  const [newPrice] = await db
    .insert(schema.optionPrices)
    .values({
      optionId: option.id,
      packageId: existingPrice?.packageId || null,
      priceDelta: dto.priceDelta.toFixed(2),
      priceType: existingPrice?.priceType || 'per_sqft',
      effectiveFrom: new Date(),
      effectiveTo: null,
    })
    .returning();

  return newPrice;
}

export async function updateAdminPackageItem(packageItemId: number, dto: UpdatePackageItemDto) {
  const item = await db.query.packageItems.findFirst({
    where: eq(schema.packageItems.id, packageItemId),
  });

  if (!item) {
    throw new AdminServiceError(404, 'PACKAGE_ITEM_NOT_FOUND', `Package item with ID ${packageItemId} not found`);
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


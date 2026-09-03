import {
  db,
  schema,
  eq,
  and,
  isNull,
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

  const allPrices = await db
    .select()
    .from(schema.packagePrices);

  return allPackages.map((pkg) => {
    const activePrice = allPrices.find((p) => p.packageId === pkg.id) || null;
    return {
      ...pkg,
      activePrice,
      priceHistory: activePrice ? [activePrice] : [],
    };
  });
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

  const [newPrice] = await db
    .update(schema.packagePrices)
    .set({
      pricePerSqft: dto.pricePerSqft.toFixed(2),
      volumePricePerSqft: dto.volumePricePerSqft.toFixed(2),
      volumeDiscountThresholdSqft: dto.volumeDiscountThresholdSqft,
      ...(dto.headRoomPricePerSqft !== undefined && { headRoomPricePerSqft: dto.headRoomPricePerSqft.toFixed(2) }),
    })
    .where(eq(schema.packagePrices.packageId, pkg.id))
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

export async function deleteAdminLocation(locationId: number) {
  const existing = await db.query.locations.findFirst({
    where: eq(schema.locations.id, locationId),
  });

  if (!existing) {
    throw new AdminServiceError(404, 'LOCATION_NOT_FOUND', `Location with ID ${locationId} not found`);
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
    .from(schema.addonPrices);

  return allAddons.map((addon) => {
    const addonPricesList = allPrices.filter((p) => p.addonId === addon.id);
    return {
      ...addon,
      activePrices: addonPricesList,
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

  // Update in-place!
  const [updatedPrice] = await db
    .update(schema.addonPrices)
    .set({
      price: dto.price.toFixed(2),
    })
    .where(
      and(
        eq(schema.addonPrices.addonId, addon.id),
        eq(schema.addonPrices.variantSlug, dto.variantSlug)
      )
    )
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
            activePrice: optionPricesList.find((p) => p.optionId === opt.id) || null,
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

export async function createAdminOption(dto: CreateOptionDto) {
  const item = await db.query.items.findFirst({
    where: eq(schema.items.id, dto.itemId),
  });

  if (!item) {
    throw new AdminServiceError(404, 'ITEM_NOT_FOUND', `Item with ID ${dto.itemId} not found`);
  }

  const rawSlug = (dto.slug?.trim() || dto.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')).replace(/^_+|_+$/g, '') || `opt_${Date.now()}`;

  const [createdOption] = await db
    .insert(schema.options)
    .values({
      itemId: dto.itemId,
      brandName: dto.name,
      slug: rawSlug,
      specification: dto.description || '',
    })
    .returning();

  const itemPriceType = item.unit === 'fixed' ? 'fixed' : 'per_sqft';
  let createdPrices: any[] = [];
  if (dto.prices && dto.prices.length > 0) {
    // Deduplicate by packageId to prevent DB issues
    const priceMap = new Map();
    for (const p of dto.prices) {
      priceMap.set(p.packageId, p);
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
    
    createdPrices = await db.insert(schema.optionPrices).values(inserts).returning();
  } else {
    // Default to 0.00 for all active packages
    const activePkgs = await db.query.packages.findMany({
      where: eq(schema.packages.isActive, true),
    });
    if (activePkgs.length > 0) {
      const inserts = activePkgs.map((pkg) => ({
        optionId: createdOption.id,
        packageId: pkg.id,
        priceDelta: '0.00',
        priceType: itemPriceType,
      }));
      createdPrices = await db.insert(schema.optionPrices).values(inserts).returning();
    }
  }

  return {
    ...createdOption,
    name: createdOption.brandName,
    activePrice: createdPrices[0] || null,
    prices: createdPrices,
  };
}

export async function deleteAdminOption(optionId: number) {
  const option = await db.query.options.findFirst({
    where: eq(schema.options.id, optionId),
  });

  if (!option) {
    throw new AdminServiceError(404, 'OPTION_NOT_FOUND', `Option with ID ${optionId} not found`);
  }

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

  // Update option brandName if provided
  if (dto.name) {
    await db
      .update(schema.options)
      .set({ brandName: dto.name })
      .where(eq(schema.options.id, optionId));
  }

  // Update option prices strictly per package
  let newPrices: any[] = [];
  
  if (dto.prices && dto.prices.length > 0) {
    // Delete existing prices
    await db.delete(schema.optionPrices).where(eq(schema.optionPrices.optionId, optionId));
    
    // Deduplicate by packageId
    const priceMap = new Map();
    for (const p of dto.prices) {
      priceMap.set(p.packageId, p);
    }
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
    
    newPrices = await db.insert(schema.optionPrices).values(inserts).returning();
  }

  return { id: optionId, name: dto.name || option.brandName, prices: newPrices };
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


import { randomBytes } from 'crypto';
import {
  db,
  packages,
  packagePrices,
  locations,
  items,
  options,
  packageItems,
  optionPrices,
  addons,
  addonPrices,
  estimates,
  estimateItems,
  estimateAddons,
  milestoneStages,
  schema,
  eq,
  and,
  sql,
  isNull,
  or,
  inArray,
  asc,
  desc,
  Column,
} from '@asthiwar/database';
import {
  AreaUnit,
  FloorCount,
  PackageSlug,
  CalculatorInput,
  CalculationResult,
  MilestoneStage,
  CustomizationDetail,
  AddonDetail,
} from './calculator.types.js';

// ---------------------------------------------------------------------------
// Price versioning
// ---------------------------------------------------------------------------

/**
 * The single definition of "the currently active price row".
 *
 * Price tables are append-only (Rules #7/#8): editing a price retires the old row
 * with `effectiveTo = NOW()` and inserts a new one. Every read that wants *today's*
 * price must filter on this, or it will also see retired history.
 *
 * Use this everywhere instead of re-typing the predicate. Copy-pasting it is what
 * let the catalog endpoints drift from the estimate engine and serve retired prices.
 */
export function activePriceCondition(table: {
  effectiveFrom: Column;
  effectiveTo: Column;
}) {
  return and(
    sql`${table.effectiveFrom} <= NOW()`,
    or(isNull(table.effectiveTo), sql`${table.effectiveTo} > NOW()`)
  );
}

// ---------------------------------------------------------------------------
// Constants & Lookups
// ---------------------------------------------------------------------------

export const STANDARD_EXCLUSIONS: string[] = [
  'Elevation Work (special exterior elements)',
  'Outer Area Development (Setback paving, landscaping)',
  'Interior Works and Carpentry (wardrobes, modular kitchen)',
  'DTCP and Building Approval Charges',
  'EB Connection & Electricity Bills',
  'Gas Connection & Charges',
  'Water Connection & Charges',
  'Borewell and Bore Pipings',
  'Motors & Submersibles',
  'Electrical Appliances (TV, Fridge, AC, Dishwasher, Chimney)',
  'VLT and Property Taxes',
];

export const MILESTONE_DEFINITIONS = [
  { stageNumber: 1, stageName: 'Design & Approvals', percentage: 3, keyDeliverables: 'Soil test, floor plan, structural drawing, DTCP approval assistance' },
  { stageNumber: 2, stageName: 'Earthwork & Excavation', percentage: 4, keyDeliverables: 'Foundation trenching, site leveling, anti-termite treatment' },
  { stageNumber: 3, stageName: 'Foundation & Plinth', percentage: 15, keyDeliverables: 'Footing concrete, plinth beam, basement filling, PCC/RCC basement' },
  { stageNumber: 4, stageName: 'RCC Structure (Columns & Slabs)', percentage: 22, keyDeliverables: 'Column casting, roof slab shuttering, beam reinforcement & curing' },
  { stageNumber: 5, stageName: 'Brickwork & Masonry', percentage: 14, keyDeliverables: 'External & internal walls, lintels, parapet wall construction' },
  { stageNumber: 6, stageName: 'Electrical & Plumbing Concealing', percentage: 8, keyDeliverables: 'Conduits, plumbing lines, switch boxes, drainage routing' },
  { stageNumber: 7, stageName: 'Plastering (Internal & External)', percentage: 10, keyDeliverables: 'Ceiling plastering, wall leveling, exterior weather-coat plaster' },
  { stageNumber: 8, stageName: 'Flooring & Wall Tiling', percentage: 11, keyDeliverables: 'Main vitrified tiles, bathroom tiling, kitchen granite countertop' },
  { stageNumber: 9, stageName: 'Painting & Woodwork', percentage: 8, keyDeliverables: 'Putty, primer, emulsion coats, main door & internal door fixing' },
  { stageNumber: 10, stageName: 'Fixtures, Finishing & Handover', percentage: 5, keyDeliverables: 'CP & sanitary fittings, switches, lights, glass railings, deep clean' },
];

export function getDurationForFloors(floorsAboveGround: number) {
  if (floorsAboveGround === 0) return { range: '5–6 Months', min: 5, max: 6, floorNumber: 1 };
  if (floorsAboveGround === 1) return { range: '7–8 Months', min: 7, max: 8, floorNumber: 2 };
  if (floorsAboveGround === 2) return { range: '9–11 Months', min: 9, max: 11, floorNumber: 3 };
  if (floorsAboveGround === 3) return { range: '12–14 Months', min: 12, max: 14, floorNumber: 4 };

  // For each floor beyond 3, add 2 months to min and max.
  const extraFloors = floorsAboveGround - 3;
  const min = 12 + (extraFloors * 2);
  const max = 14 + (extraFloors * 2);
  return {
    range: `${min}–${max} Months`,
    min,
    max,
    floorNumber: floorsAboveGround + 1,
  };
}

// ---------------------------------------------------------------------------
// Unit Conversion Helpers
// ---------------------------------------------------------------------------

export function convertAreaToSqft(area: number, unit: AreaUnit = 'sqft'): number {
  switch (unit) {
    case 'cents':
      return Number((area * 435.6).toFixed(2));
    case 'sqyards':
      return Number((area * 9).toFixed(2));
    case 'sqm':
      return Number((area * 10.7639).toFixed(2));
    case 'sqft':
    default:
      return Number(area.toFixed(2));
  }
}

export function generateEstimateNumber(): string {
  const year = new Date().getFullYear();
  const hexSuffix = randomBytes(3).toString('hex').toUpperCase();
  return `EST-${year}-${hexSuffix}`;
}

// ---------------------------------------------------------------------------
// Core Calculation Engine
// ---------------------------------------------------------------------------

export async function calculateEstimate(
  input: CalculatorInput,
  optionsConfig: { persist?: boolean } = { persist: false }
): Promise<CalculationResult> {
  // 1. Dimensions & Area Calculation
  const plotAreaSqft = convertAreaToSqft(input.plotArea, input.plotAreaUnit);
  const builtupPerFloorSqft = convertAreaToSqft(input.builtupAreaPerFloor, input.builtupAreaUnit);
  const floorConfig = getDurationForFloors(input.floorCount || 0);
  const numberOfFloors = floorConfig.floorNumber;
  const carParkingAreaSqft = Number((input.carParkingAreaSqft ?? 0).toFixed(2));
  const carCount = input.carCount ?? 1;

  let totalBuiltupAreaSqft = 0;
  if (input.floorBreakdown && input.floorBreakdown.length > 0) {
    totalBuiltupAreaSqft = input.floorBreakdown.reduce((sum, area) => sum + convertAreaToSqft(area, input.builtupAreaUnit), 0);
  } else {
    totalBuiltupAreaSqft = Number((builtupPerFloorSqft * numberOfFloors).toFixed(2));
  }
  if (carParkingAreaSqft > 0) {
    totalBuiltupAreaSqft = Number((totalBuiltupAreaSqft + carParkingAreaSqft).toFixed(2));
  }

  // 2. Fetch Package & Active Pricing
  const pkgRows = await db
    .select({
      id: packages.id,
      slug: packages.slug,
      name: packages.name,
      tagline: packages.tagline,
      pricePerSqft: packagePrices.pricePerSqft,
      headRoomPricePerSqft: packagePrices.headRoomPricePerSqft,
      volumeThreshold: packagePrices.volumeDiscountThresholdSqft,
      volumePricePerSqft: packagePrices.volumePricePerSqft,
    })
    .from(packages)
    .innerJoin(packagePrices, eq(packagePrices.packageId, packages.id))
    .where(
      and(
        eq(packages.slug, input.packageSlug),
        eq(packages.isActive, true),
        activePriceCondition(packagePrices)
      )
    )
    .orderBy(desc(packagePrices.effectiveFrom))
    .limit(1);

  if (pkgRows.length === 0) {
    throw new Error(`Package '${input.packageSlug}' not found or inactive`);
  }

  const pkg = pkgRows[0];
  const isVolumeRateApplied = totalBuiltupAreaSqft > pkg.volumeThreshold;
  const baseRatePerSqft = isVolumeRateApplied
    ? Number(pkg.volumePricePerSqft)
    : Number(pkg.pricePerSqft);

  // 3. Location Multiplier Lookup
  let locationMultiplier = 1.0000;
  let locationName = input.plotLocation;
  let resolvedLocationId: number | null = null;

  if (input.locationId) {
    const locRows = await db
      .select()
      .from(locations)
      .where(and(eq(locations.id, input.locationId), eq(locations.isActive, true)))
      .limit(1);

    if (locRows.length === 0) {
      throw new Error(`Location with ID ${input.locationId} not found or inactive`);
    }

    locationMultiplier = Number(locRows[0].priceMultiplier);
    locationName = locRows[0].name;
    resolvedLocationId = locRows[0].id;
  } else if (input.plotLocation) {
    const normalizedLoc = input.plotLocation.toLowerCase().trim();
    const locRows = await db
      .select()
      .from(locations)
      .where(eq(locations.isActive, true));

    // Exact match first (by slug or full name)
    const exactMatch = locRows.find(
      (l) => l.slug.toLowerCase() === normalizedLoc || l.name.toLowerCase() === normalizedLoc
    );

    if (exactMatch) {
      locationMultiplier = Number(exactMatch.priceMultiplier);
      locationName = exactMatch.name;
      resolvedLocationId = exactMatch.id;
    } else {
      // Unambiguous prefix/subset match
      const prefixMatches = locRows.filter(
        (l) =>
          l.name.toLowerCase().startsWith(normalizedLoc) ||
          normalizedLoc.startsWith(l.name.toLowerCase()) ||
          l.slug.toLowerCase().startsWith(normalizedLoc) ||
          normalizedLoc.startsWith(l.slug.toLowerCase())
      );

      if (prefixMatches.length === 1) {
        locationMultiplier = Number(prefixMatches[0].priceMultiplier);
        locationName = prefixMatches[0].name;
        resolvedLocationId = prefixMatches[0].id;
      } else if (prefixMatches.length > 1) {
        throw new Error(
          `Location '${input.plotLocation}' is ambiguous and matches multiple locations (${prefixMatches
            .map((l) => l.name)
            .join(', ')}). Please select a specific location.`
        );
      } else {
        throw new Error(
          `Location '${input.plotLocation}' is not recognized. Please select a supported location.`
        );
      }
    }
  } else {
    throw new Error('Plot location is required');
  }

  const effectiveRatePerSqft = Number((baseRatePerSqft * locationMultiplier).toFixed(2));
  let baseConstructionCost = Math.round(totalBuiltupAreaSqft * effectiveRatePerSqft);

  // Add Head Room Cost
  const headRoomCost = Math.round((input.headRoomAreaSqft ?? 0) * Number(pkg.headRoomPricePerSqft));
  baseConstructionCost += headRoomCost;

  // 4. Customizations & Upgrades Calculation (Batch-optimized for O(1) in-memory lookup)
  const customizationDetails: CustomizationDetail[] = [];
  let upgradesCost = 0;

  if (input.customizations && input.customizations.length > 0) {
    const itemSlugs = input.customizations.map((c) => c.itemSlug);
    const fetchedItems = await db
      .select()
      .from(items)
      .where(inArray(items.slug, itemSlugs));
    const itemMap = new Map(fetchedItems.map((itm) => [itm.slug, itm]));
    const itemIds = fetchedItems.map((itm) => itm.id);

    const fetchedOptions = itemIds.length > 0
      ? await db
          .select()
          .from(options)
          .where(inArray(options.itemId, itemIds))
      : [];
    const optionMap = new Map(fetchedOptions.map((opt) => [`${opt.itemId}:${opt.slug}`, opt]));
    const optionIds = fetchedOptions.map((opt) => opt.id);

    const fetchedPrices = optionIds.length > 0
      ? await db
          .select()
          .from(optionPrices)
          .where(
            and(
              inArray(optionPrices.optionId, optionIds),
              or(eq(optionPrices.packageId, pkg.id), isNull(optionPrices.packageId)),
              activePriceCondition(optionPrices)
            )
          )
      : [];
    const priceMap = new Map<number, typeof fetchedPrices[0]>();
    for (const p of fetchedPrices) {
      const existing = priceMap.get(p.optionId);
      if (!existing || (p.packageId !== null && existing.packageId === null)) {
        priceMap.set(p.optionId, p);
      }
    }

    const fetchedPackageItems = itemIds.length > 0
      ? await db
          .select()
          .from(packageItems)
          .where(and(eq(packageItems.packageId, pkg.id), inArray(packageItems.itemId, itemIds)))
      : [];
    const packageItemMap = new Map(fetchedPackageItems.map((pi) => [pi.itemId, pi]));

    for (const cust of input.customizations) {
      const itm = itemMap.get(cust.itemSlug);
      if (!itm) continue;

      const opt = optionMap.get(`${itm.id}:${cust.optionSlug}`);
      if (!opt) continue;

      const priceRow = priceMap.get(opt.id);
      let unitPriceDelta = 0;
      let priceType = 'per_sqft';
      let calculatedPrice = 0;

      if (priceRow) {
        unitPriceDelta = Number(priceRow.priceDelta);
        priceType = priceRow.priceType;
        if (priceType === 'per_sqft') {
          calculatedPrice = Math.round(unitPriceDelta * totalBuiltupAreaSqft);
        } else {
          calculatedPrice = Math.round(unitPriceDelta);
        }
      } else {
        const pi = packageItemMap.get(itm.id);
        if (pi && !pi.isIncluded && Number(pi.additionalCostPrice) > 0) {
          unitPriceDelta = Number(pi.additionalCostPrice);
          priceType = 'per_sqft';
          calculatedPrice = Math.round(unitPriceDelta * totalBuiltupAreaSqft);
        }
      }

      upgradesCost += calculatedPrice;
      customizationDetails.push({
        itemId: itm.id,
        itemSlug: itm.slug,
        itemName: itm.name,
        selectedOptionId: opt.id,
        selectedOptionSlug: opt.slug,
        selectedOptionName: opt.brandName,
        unitPriceDelta,
        priceType,
        calculatedPrice,
      });
    }
  }

  // 5. Add-Ons Calculation
  const addonDetails: AddonDetail[] = [];
  let addonsCost = 0;

  if (input.addons && input.addons.length > 0) {
    for (const ad of input.addons) {
      const addonRows = await db
        .select()
        .from(addons)
        .where(and(eq(addons.slug, ad.addonSlug), eq(addons.isActive, true)))
        .limit(1);

      if (addonRows.length === 0) continue;
      const add = addonRows[0];

      // Find price matching variant and package tier
      const tierFilter = ['all'];
      if (input.packageSlug === 'basic' || input.packageSlug === 'standard') {
        tierFilter.push('basic_standard');
      } else {
        tierFilter.push('premium_luxury');
      }

      const apRows = await db
        .select()
        .from(addonPrices)
        .where(
          and(
            eq(addonPrices.addonId, add.id),
            eq(addonPrices.variantSlug, ad.variantSlug),
            activePriceCondition(addonPrices)
          )
        );

      const matchedPriceRow = apRows.find((p) => tierFilter.includes(p.packageTier)) ?? apRows[0];
      if (!matchedPriceRow) continue;

      const unitPrice = Number(matchedPriceRow.price);
      const qty = ad.quantity !== undefined ? ad.quantity : Number(add.defaultQuantity ?? 1);

      let totalPrice = 0;
      switch (add.pricingUnit) {
        case 'per_litre':
        case 'per_rft':
        case 'per_sqft_gate':
        case 'per_sqft_terrace':
          totalPrice = Math.round(unitPrice * qty);
          break;
        case 'fixed':
        default:
          totalPrice = Math.round(unitPrice * (ad.quantity ?? 1));
          break;
      }

      addonsCost += totalPrice;
      addonDetails.push({
        addonId: add.id,
        addonSlug: add.slug,
        addonName: add.name,
        selectedVariantSlug: matchedPriceRow.variantSlug,
        selectedVariantName: matchedPriceRow.variantName,
        quantity: qty,
        unit: add.pricingUnit,
        unitPrice,
        totalPrice,
      });
    }
  }

  // 6. Subtotals & Final Totals
  const subtotalCost = baseConstructionCost + upgradesCost + addonsCost;
  const gstPercentage = 0.00; // As standard per civil construction quote estimates
  const gstAmount = Math.round(subtotalCost * (gstPercentage / 100));
  const totalProjectCost = subtotalCost + gstAmount;
  const effectiveTotalCostPerSqft = totalBuiltupAreaSqft > 0
    ? Number((totalProjectCost / totalBuiltupAreaSqft).toFixed(2))
    : 0;

  // 7. Milestone Phase Schedule
  const dbMilestones = await db
    .select()
    .from(milestoneStages)
    .where(eq(milestoneStages.isActive, true))
    .orderBy(asc(milestoneStages.stageNumber));

  const activeMilestoneDefs = dbMilestones.length > 0
    ? dbMilestones.map((m) => ({
        stageNumber: m.stageNumber,
        stageName: m.stageName,
        percentage: Number(m.percentage),
        keyDeliverables: m.keyDeliverables,
      }))
    : MILESTONE_DEFINITIONS;

  let distributedAmountSum = 0;
  const milestones: MilestoneStage[] = activeMilestoneDefs.map((m, index) => {
    const isLast = index === activeMilestoneDefs.length - 1;
    let amount = Math.round(totalProjectCost * (m.percentage / 100));

    if (isLast) {
      // Ensure sum is exactly equal to totalProjectCost
      amount = totalProjectCost - distributedAmountSum;
    } else {
      distributedAmountSum += amount;
    }

    return {
      stageNumber: m.stageNumber,
      stageName: m.stageName,
      percentage: m.percentage,
      amount,
      keyDeliverables: m.keyDeliverables,
    };
  });

  let estimateNumber = generateEstimateNumber();
  let retries = 0;
  while (retries < 10) {
    const existing = await db.query.estimates.findFirst({
      where: eq(estimates.estimateNumber, estimateNumber),
    });
    if (!existing) break;
    estimateNumber = generateEstimateNumber();
    retries++;
  }

  const result: CalculationResult = {
    estimateNumber,
    customer: {
      name: input.customerName,
      phone: input.customerPhone,
      email: input.customerEmail ?? '',
      location: input.plotLocation,
    },
    dimensions: {
      plotAreaSqft,
      plotAreaUnit: input.plotAreaUnit ?? 'sqft',
      builtupAreaPerFloorSqft: builtupPerFloorSqft,
      floorCount: input.floorCount,
      numberOfFloors,
      carParkingAreaSqft,
      carCount,
      totalBuiltupAreaSqft,
    },
    package: {
      id: pkg.id,
      slug: pkg.slug as PackageSlug,
      name: pkg.name,
      tagline: pkg.tagline,
      baseRatePerSqft,
      effectiveRatePerSqft,
      isVolumeRateApplied,
      locationMultiplier,
      locationName,
    },
    breakdown: {
      baseConstructionCost,
      upgradesCost,
      addonsCost,
      subtotalCost,
      gstPercentage,
      gstAmount,
      totalProjectCost,
      effectiveTotalCostPerSqft,
    },
    duration: {
      estimatedMonthsRange: floorConfig.range,
      minMonths: floorConfig.min,
      maxMonths: floorConfig.max,
    },
    customizations: customizationDetails,
    addons: addonDetails,
    milestones,
    disclaimers: STANDARD_EXCLUSIONS,
  };

  // 8. Immutable DB Persistence if requested (Wrapped in atomic transaction - Fixes O9)
  if (optionsConfig.persist) {
    await db.transaction(async (tx) => {
      const [insertedEstimate] = await tx
        .insert(estimates)
        .values({
          estimateNumber,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          customerEmail: input.customerEmail ?? '',
          plotLocation: input.plotLocation,
          locationId: resolvedLocationId,
          locationMultiplier: locationMultiplier.toFixed(4),
          plotAreaSqft: plotAreaSqft.toFixed(2),
          plotAreaUnit: input.plotAreaUnit ?? 'sqft',
          builtupAreaPerFloorSqft: builtupPerFloorSqft.toFixed(2),
          floorCount: input.floorCount === 0 ? 'Ground' : `G+${input.floorCount}`,
          numberOfFloors: numberOfFloors,
          floorBreakdownJson: input.floorBreakdown ?? null,
          carParkingAreaSqft: carParkingAreaSqft.toFixed(2),
          carCount,
          totalBuiltupAreaSqft: totalBuiltupAreaSqft.toFixed(2),
          packageId: pkg.id,
          packageSlug: pkg.slug,
          packageRatePerSqft: effectiveRatePerSqft.toFixed(2),
          baseConstructionCost: baseConstructionCost.toFixed(2),
          upgradesCost: upgradesCost.toFixed(2),
          addonsCost: addonsCost.toFixed(2),
          subtotalCost: subtotalCost.toFixed(2),
          gstPercentage: gstPercentage.toFixed(2),
          gstAmount: gstAmount.toFixed(2),
          totalProjectCost: totalProjectCost.toFixed(2),
          milestoneBreakdownJson: milestones,
          fullSnapshotJson: result,
          status: 'GENERATED',
        })
        .returning({ id: estimates.id });

      result.estimateId = insertedEstimate.id;

      // Insert customization items within transaction
      if (customizationDetails.length > 0) {
        await tx.insert(estimateItems).values(
          customizationDetails.map((c) => ({
            estimateId: insertedEstimate.id,
            itemId: c.itemId,
            itemSlug: c.itemSlug,
            itemName: c.itemName,
            selectedOptionId: c.selectedOptionId,
            selectedOptionName: c.selectedOptionName,
            unitPriceDelta: c.unitPriceDelta.toFixed(2),
            calculatedPrice: c.calculatedPrice.toFixed(2),
          }))
        );
      }

      // Insert addon items within transaction
      if (addonDetails.length > 0) {
        await tx.insert(estimateAddons).values(
          addonDetails.map((a) => ({
            estimateId: insertedEstimate.id,
            addonId: a.addonId,
            addonSlug: a.addonSlug,
            addonName: a.addonName,
            selectedVariant: a.selectedVariantName,
            quantity: a.quantity.toFixed(2),
            unit: a.unit,
            unitPrice: a.unitPrice.toFixed(2),
            totalPrice: a.totalPrice.toFixed(2),
          }))
        );
      }
    });
  }

  return result;
}

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
  enquiries,
  schema,
  eq,
  and,
  sql,
  isNull,
  or,
  inArray,
  asc,
  desc,
} from '@asthiwar/database';
import { packageTierApplies, packageTierSpecificity } from '../../services/addon-tiers.js';
import { isCurrentPrice } from '../../services/pricing-window.js';
import { postgresErrorOf } from '../../services/db-errors.js';
import {
  DRAFT_QUOTATION_NUMBER,
  QUOTATION_CHANNELS,
  QUOTATION_EXCLUSIONS,
  generateEstimateAccessToken,
  nextQuotationNumber,
  quotationLinkExpiry,
} from './quotation.js';
import {
  AreaUnit,
  FloorCount,
  PackageSlug,
  CalculatorInput,
  CalculationResult,
  MilestoneStage,
  CustomizationDetail,
  AddonDetail,
  floorsIncludingGround,
} from './calculator.types.js';
import {
  convertAreaToSqft,
  distributeMilestoneAmounts,
  getDurationForFloors,
  totalEnclosedArea,
} from './pricing-math.js';

// Re-exported: these were defined here, and the pure arithmetic has moved to
// pricing-math.ts so it can be tested without a database connection. Callers and
// tests that already import them from this module are unaffected.
export { convertAreaToSqft, getDurationForFloors, totalEnclosedArea };

/** One reason a requested selection could not be turned into a priced line. */
export interface CalculationIssue {
  path: string;
  message: string;
}

/**
 * The customer asked for something the catalogue cannot price.
 *
 * The engine used to `continue` past an unknown item, option, add-on or variant,
 * and past a quantity outside the add-on's own limits. The estimate still came
 * back 200, still called itself authoritative, and was simply missing the scope
 * the customer selected — or priced a 1-litre sump at ₹26. Silence is the wrong
 * answer for a quotation: refuse it and say which selections failed.
 *
 * 422, not 400: the request is well-formed, the selections just are not priceable.
 */
export class CalculationRejectedError extends Error {
  public readonly statusCode = 422;
  public readonly code = 'ESTIMATE_NOT_PRICEABLE';

  constructor(public readonly details: CalculationIssue[]) {
    super(
      `${details.length} selection${details.length === 1 ? '' : 's'} could not be priced. ` +
        'Refresh the configurator and try again — the catalogue may have changed.'
    );
    this.name = 'CalculationRejectedError';
  }
}

/** Every quotation number in this year's run is spoken for. */
export class QuotationNumberUnavailableError extends Error {
  public readonly statusCode = 503;
  public readonly code = 'QUOTATION_NUMBER_UNAVAILABLE';

  constructor(attempts: number) {
    super(`Could not claim a quotation number after ${attempts} attempts. Please retry.`);
    this.name = 'QuotationNumberUnavailableError';
  }
}

/**
 * Did this failure mean "that quotation number is already taken"?
 *
 * 23505 is Postgres's unique_violation. The estimates table has other unique
 * columns, so the constraint is checked by name — retrying the number would not
 * help with any other collision, and looping on one would hide a real fault.
 */
function isQuotationNumberCollision(error: unknown): boolean {
  const pgError = postgresErrorOf(error);
  if (!pgError || pgError.code !== '23505') return false;
  return Boolean(
    pgError.constraint?.includes('estimate_number') || pgError.detail?.includes('estimate_number')
  );
}

// ---------------------------------------------------------------------------
// Constants & Lookups
// ---------------------------------------------------------------------------

/**
 * Re-exported from the quotation module so the estimate JSON, the web report and
 * the printed PDF all quote one list. Edit it in quotation.ts, not here.
 */
export const STANDARD_EXCLUSIONS: readonly string[] = QUOTATION_EXCLUSIONS;

/** Quantity ceilings for add-ons the catalogue gives no maximum. See the add-on step below. */
const DEFAULT_MAX_FIXED_ADDON_UNITS = 10;
/** Matches the calculator form's own fallback maximum. */
const DEFAULT_MAX_MEASURED_ADDON_QUANTITY = 100_000;

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

// ---------------------------------------------------------------------------
// Unit Conversion Helpers
// ---------------------------------------------------------------------------

export function generateEstimateNumber(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `EST-${year}-${randomNum}`;
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
    .innerJoin(
      packagePrices,
      and(
        eq(packagePrices.packageId, packages.id),
        isCurrentPrice(packagePrices.effectiveTo)
      )
    )
    .where(and(eq(packages.slug, input.packageSlug), eq(packages.isActive, true)))
    .orderBy(desc(packagePrices.effectiveFrom))
    .limit(1);

  // Collected across the location, customization and add-on steps so the customer
  // is told everything that is wrong at once, rather than fixing one selection
  // only to be refused on the next.
  const issues: CalculationIssue[] = [];

  // A tier the customer can no longer be sold.
  //
  // This was a bare `throw new Error`, which the error handler can only read as a
  // 500 — so deactivating a package in the admin console (an ordinary action, and
  // the one the console offers instead of deleting) made every in-flight
  // configurator session fail as though the server had broken. It is the customer's
  // selection that is stale, not the server: 422, with a message saying so.
  //
  // Unlike the location below this cannot be collected and carried — every rate on
  // the quotation comes from `pkg` — so it refuses on the spot.
  if (pkgRows.length === 0) {
    throw new CalculationRejectedError([
      {
        path: 'packageSlug',
        message:
          `The '${input.packageSlug}' package is no longer offered. ` +
          'Reload the calculator and choose from the current packages.',
      },
    ]);
  }

  const pkg = pkgRows[0];

  // Head room is priced separately from the built-up area — its own rate over its
  // own area, so the base line on the quotation multiplies out — but it is still
  // built structure, and the volume discount is a discount for building more of
  // it. Testing the threshold against built-up area alone meant two builds with
  // the same enclosed area were charged different rates purely by where the area
  // was booked: 3,400 sq.ft plus 200 of parking crossed the threshold, 3,400 plus
  // 200 of head room did not, a swing of roughly ₹50/sq.ft across the whole job.
  const headRoomAreaSqft = Number((input.headRoomAreaSqft ?? 0).toFixed(2));
  const totalEnclosedAreaSqft = totalEnclosedArea(totalBuiltupAreaSqft, headRoomAreaSqft);

  const isVolumeRateApplied = totalEnclosedAreaSqft > pkg.volumeThreshold;
  const baseRatePerSqft = isVolumeRateApplied
    ? Number(pkg.volumePricePerSqft)
    : Number(pkg.pricePerSqft);

  // 3. Location Multiplier Lookup
  let locationMultiplier = 1.0000;
  let locationName = input.plotLocation;
  let resolvedLocationId: number | null = null;

  // The city has to resolve to a catalogue row, and saying so out loud matters
  // more here than anywhere else in this function.
  //
  // Both branches used to fall through silently to 1.0000 — the multiplier, not a
  // refusal — while `locationName` kept whatever the customer typed. Two ways in:
  //
  //  - A `locationId` that no longer resolves. Deactivating a city is exactly what
  //    the admin console recommends over deleting it, and any configurator session
  //    already holding that id then priced at 1.0000 with the city's real name
  //    still printed on the quotation. Chennai is 1.05, so a ₹73.05L job was issued,
  //    signed and PDF'd at ₹69.58L — ₹3.47L under, with "Chennai" on the paper.
  //  - A free-text location matching nothing. 'Dubai' returned a full authoritative
  //    quotation. Note that 1.0000 is not even the conservative guess: the
  //    catalogue's own catch-all, Other TN, is 0.96.
  //
  // A mispriced quotation is worse than a refused one, and this file already
  // refuses every add-on and option it cannot price. The city is no different.
  if (input.locationId) {
    const locRows = await db
      .select()
      .from(locations)
      .where(and(eq(locations.id, input.locationId), eq(locations.isActive, true)))
      .limit(1);

    if (locRows.length > 0) {
      locationMultiplier = Number(locRows[0].priceMultiplier);
      locationName = locRows[0].name;
      resolvedLocationId = locRows[0].id;
    } else {
      issues.push({
        path: 'locationId',
        message:
          `'${input.plotLocation}' is no longer a city we price for. ` +
          'Reload the calculator and choose your location again.',
      });
    }
  } else if (input.plotLocation) {
    const normalizedLoc = input.plotLocation.toLowerCase().trim();
    const locRows = await db
      .select()
      .from(locations)
      .where(eq(locations.isActive, true));

    const matched = locRows.find(
      (l) => l.slug.toLowerCase() === normalizedLoc || normalizedLoc.includes(l.slug.toLowerCase()) || normalizedLoc.includes(l.name.toLowerCase())
    );

    if (matched) {
      locationMultiplier = Number(matched.priceMultiplier);
      locationName = matched.name;
      resolvedLocationId = matched.id;
    } else {
      issues.push({
        path: 'plotLocation',
        message:
          `We do not have a rate for '${input.plotLocation}'. ` +
          'Choose one of the listed cities, or Other TN if yours is not among them.',
      });
    }
  }

  const effectiveRatePerSqft = Number((baseRatePerSqft * locationMultiplier).toFixed(2));

  // `baseConstructionCost` is exactly area × the effective rate, so the line the
  // customer reads — "N sq.ft @ ₹R/sq.ft" — multiplies out to the figure printed
  // beside it. Head room is charged at its own rate over its own area, so folding
  // it in here made that line fail to add up.
  const baseConstructionCost = Math.round(totalBuiltupAreaSqft * effectiveRatePerSqft);

  // The city multiplier applies here too.
  //
  // It represents what building in that city costs — labour, material, logistics —
  // and none of that stops at the stairwell. Charging the main floors at Chennai's
  // 1.05 and the head room at the flat catalogue rate made the same structure cost
  // two different things depending on which line it landed on.
  const headRoomBaseRatePerSqft = Number(pkg.headRoomPricePerSqft);
  const headRoomRatePerSqft = Number((headRoomBaseRatePerSqft * locationMultiplier).toFixed(2));
  const headRoomCost = Math.round(headRoomAreaSqft * headRoomRatePerSqft);

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
              isCurrentPrice(optionPrices.effectiveTo)
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

    // One component resolves to one choice.
    //
    // Nothing stopped the same itemSlug appearing twice, and both lines were
    // priced: a request naming two different basement heights was quoted for two
    // basements on one house — Rs 90,000 where the single choice costs Rs 60,000.
    // The configurator replaces a selection rather than appending one, so this is
    // unreachable through the UI; the endpoint is public, so that is not a
    // guarantee. Refused rather than silently collapsed, because picking which of
    // the two the customer meant is a guess.
    const seenItemSlugs = new Set<string>();

    for (const [index, cust] of input.customizations.entries()) {
      if (seenItemSlugs.has(cust.itemSlug)) {
        issues.push({
          path: `customizations.${index}.itemSlug`,
          message: `'${cust.itemSlug}' is chosen more than once. Each component takes a single option.`,
        });
        continue;
      }
      seenItemSlugs.add(cust.itemSlug);

      const itm = itemMap.get(cust.itemSlug);
      if (!itm) {
        issues.push({
          path: `customizations.${index}.itemSlug`,
          message: `No component named '${cust.itemSlug}' is in the catalogue.`,
        });
        continue;
      }

      const opt = optionMap.get(`${itm.id}:${cust.optionSlug}`);
      if (!opt) {
        issues.push({
          path: `customizations.${index}.optionSlug`,
          message: `'${cust.optionSlug}' is not an available choice for ${itm.name}.`,
        });
        continue;
      }

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
          // Read the component's own unit rather than assuming per-sqft. A
          // component declared 'fixed', 'item' or 'allowance' carries a lump sum,
          // and multiplying that by the whole built-up area turned a ₹25,000
          // charge into ₹4.25 crore on a 1,700 sq.ft build.
          priceType = itm.unit === 'sqft' || itm.unit === 'rft' ? 'per_sqft' : 'fixed';
          calculatedPrice =
            priceType === 'per_sqft'
              ? Math.round(unitPriceDelta * totalBuiltupAreaSqft)
              : Math.round(unitPriceDelta);
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
    // Batched, rather than two queries per add-on inside the loop. A fifteen
    // add-on estimate issued thirty sequential round trips, on the endpoint that
    // runs behind every keystroke in the configurator.
    const requestedAddonSlugs = Array.from(new Set(input.addons.map((a) => a.addonSlug)));

    const fetchedAddons = await db
      .select()
      .from(addons)
      .where(and(inArray(addons.slug, requestedAddonSlugs), eq(addons.isActive, true)));
    const addonMap = new Map(fetchedAddons.map((a) => [a.slug, a]));

    const fetchedAddonPrices = fetchedAddons.length > 0
      ? await db
          .select()
          .from(addonPrices)
          .where(
            and(
              inArray(
                addonPrices.addonId,
                fetchedAddons.map((a) => a.id)
              ),
              isCurrentPrice(addonPrices.effectiveTo)
            )
          )
      : [];

    const pricesByAddonVariant = new Map<string, typeof fetchedAddonPrices>();
    for (const row of fetchedAddonPrices) {
      const key = `${row.addonId}:${row.variantSlug}`;
      const bucket = pricesByAddonVariant.get(key);
      if (bucket) bucket.push(row);
      else pricesByAddonVariant.set(key, [row]);
    }

    // The same add-on twice is billed twice.
    //
    // Three of one water tank came back as three lines and three times the money,
    // on an "authoritative" quotation. An exact repeat of the same variant is
    // never meaningful — the quantity field is how you ask for more of something.
    // A second *variant* of the same add-on is meaningful only where the
    // catalogue says so: `allows_multiple` covers cases like motor automation
    // fitted to the bore-water and corporation-water tanks independently.
    const seenAddonVariants = new Set<string>();
    const seenAddonSlugs = new Set<string>();

    for (const [index, ad] of input.addons.entries()) {
      const add = addonMap.get(ad.addonSlug);

      if (!add) {
        issues.push({
          path: `addons.${index}.addonSlug`,
          message: `Add-on '${ad.addonSlug}' is not available.`,
        });
        continue;
      }

      const variantKey = `${ad.addonSlug}:${ad.variantSlug}`;
      if (seenAddonVariants.has(variantKey)) {
        issues.push({
          path: `addons.${index}.addonSlug`,
          message: `${add.name} is selected more than once with the same option. Use the quantity to ask for more.`,
        });
        continue;
      }

      if (seenAddonSlugs.has(ad.addonSlug) && !add.allowsMultiple) {
        issues.push({
          path: `addons.${index}.variantSlug`,
          message: `${add.name} takes a single option, but more than one was selected.`,
        });
        continue;
      }

      seenAddonVariants.add(variantKey);
      seenAddonSlugs.add(ad.addonSlug);

      const apRows = pricesByAddonVariant.get(`${add.id}:${ad.variantSlug}`) ?? [];

      // Prefer the row scoped most narrowly to this package; fall back to any
      // row so an odd tier value still prices rather than silently dropping.
      const matchedPriceRow =
        apRows
          .filter((p) => packageTierApplies(p.packageTier, input.packageSlug))
          .sort(
            (a, b) => packageTierSpecificity(a.packageTier) - packageTierSpecificity(b.packageTier)
          )[0] ?? apRows[0];
      if (!matchedPriceRow) {
        issues.push({
          path: `addons.${index}.variantSlug`,
          message: `'${ad.variantSlug}' is not an available variant of ${add.name}.`,
        });
        continue;
      }

      let unitPrice = Number(matchedPriceRow.price);
      const qty = ad.quantity !== undefined ? ad.quantity : Number(add.defaultQuantity ?? 1);

      // The catalogue's own quantity bounds, enforced. They were read only to
      // render the spinner's min/max, which a hand-made request never sees — so a
      // 1-litre sump (minimum 1,000) priced at Rs 26 and was accepted as authoritative.
      const minQty = add.minQuantity !== null ? Number(add.minQuantity) : null;
      const maxQty = add.maxQuantity !== null ? Number(add.maxQuantity) : null;

      if (minQty !== null && qty < minQty) {
        issues.push({
          path: `addons.${index}.quantity`,
          message: `${add.name} has a minimum of ${minQty} ${add.pricingUnit === 'per_litre' ? 'litres' : 'units'}; ${qty} was requested.`,
        });
        continue;
      }

      // An add-on the catalogue gives no maximum still has one. Every fixed-price
      // add-on is seeded without a maximum and its price is multiplied by the
      // quantity, so a hand-made request for 1,000 passenger lifts priced — and
      // stored — as a real lead. Setting a maximum in the admin console overrides
      // these defaults.
      const effectiveMaxQty =
        maxQty ?? (add.pricingUnit === 'fixed' ? DEFAULT_MAX_FIXED_ADDON_UNITS : DEFAULT_MAX_MEASURED_ADDON_QUANTITY);

      if (qty > effectiveMaxQty) {
        issues.push({
          path: `addons.${index}.quantity`,
          message: `${add.name} has a maximum of ${effectiveMaxQty} ${add.pricingUnit === 'per_litre' ? 'litres' : 'units'}; ${qty} was requested.`,
        });
        continue;
      }

      // Roof weathering is complimentary in Premium and Luxury.
      //
      // There was a second branch here making it free for Basic and Standard when
      // the terrace exceeded 2000 sq.ft. It has been removed because it could never
      // fire: `cool_roof_tiles` is seeded with maxQuantity 2000, and that maximum is
      // enforced above, so `qty > 2000` is unreachable. It only ever looked live
      // because quantity limits went unchecked, and even then only for a request
      // that bypassed the configurator.
      //
      // Deleting it changes nothing about what anyone is charged. Reinstating the
      // offer is a pricing decision: raise the add-on's maxQuantity above the
      // threshold, then add the branch back against that threshold. It is not
      // something to infer from the old code.
      //
      // The condition also tested a `roof_weathering` slug, which is not in the
      // catalogue at all.
      if (add.slug === 'cool_roof_tiles') {
        if (input.packageSlug === 'premium' || input.packageSlug === 'luxury') {
          unitPrice = 0;
        }
      }

      // Every pricing unit is a rate times an amount — 'fixed' simply has an amount
      // of 1 unless the catalogue or the customer says otherwise, which is exactly
      // what `qty` already resolves. `qty` is also the figure reported on the line,
      // so it has to be the figure charged.
      //
      // This was a switch listing the measured units, with everything else falling
      // through to a flat price. Two bugs came out of that shape: 'per_sqft' was
      // never listed even though the admin console offers it, so a Rs 120/sq.ft
      // ceiling billed as Rs 120 flat; and the fallback multiplied by
      // `ad.quantity ?? 1` instead of `qty`, so an add-on with a catalogue default
      // quantity reported one amount on the line and charged another. An allow-list
      // of units fails silently every time a new unit is added — this cannot.
      const totalPrice = Math.round(unitPrice * qty);

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

  // Refuse before any total is reported. An estimate that quietly omits what the
  // customer selected is worse than no estimate — they would sign off on a number
  // that does not cover the work they asked for.
  if (issues.length > 0) {
    throw new CalculationRejectedError(issues);
  }

  // 6. Subtotals & Final Totals
  const subtotalCost = baseConstructionCost + headRoomCost + upgradesCost + addonsCost;
  const gstPercentage = 0.00; // As standard per civil construction quote estimates
  const gstAmount = Math.round(subtotalCost * (gstPercentage / 100));
  const totalProjectCost = subtotalCost + gstAmount;

  // Downgrade credits are negative deltas, so upgradesCost can legitimately be
  // below zero — but the quotation as a whole cannot be. A mistyped delta in the
  // admin console (−5000 where −50 was meant) would otherwise print a negative
  // total and a milestone schedule of negative instalments. Refuse instead.
  if (totalProjectCost <= 0) {
    throw new CalculationRejectedError([
      {
        path: 'customizations',
        message:
          `The selected combination prices out at ₹${totalProjectCost.toLocaleString('en-IN')}, ` +
          'which cannot be quoted. A downgrade credit is likely misconfigured.',
      },
    ]);
  }

  // Divided by every square foot the total was charged over, head room included.
  // The numerator already carried the head room cost while the denominator left
  // its area out, so quoting head room inflated the headline "all-in rate" against
  // an area the customer was not being shown.
  const effectiveTotalCostPerSqft = totalEnclosedAreaSqft > 0
    ? Number((totalProjectCost / totalEnclosedAreaSqft).toFixed(2))
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

  // The last stage absorbs the rounding so the instalments sum to the total
  // exactly — see distributeMilestoneAmounts.
  const milestoneAmounts = distributeMilestoneAmounts(
    totalProjectCost,
    activeMilestoneDefs.map((m) => m.percentage)
  );

  const milestones: MilestoneStage[] = activeMilestoneDefs.map((m, index) => ({
    stageNumber: m.stageNumber,
    stageName: m.stageName,
    percentage: m.percentage,
    amount: milestoneAmounts[index],
    keyDeliverables: m.keyDeliverables,
  }));

  // A preview must not consume a sequence number — it would leave gaps for every
  // keystroke the customer makes, and show a number that is never issued.
  // The real number is claimed at insert time in step 8, because only the unique
  // index can arbitrate between two requests arriving at once. Reading the highest
  // number here and checking it was free was a time-of-check/time-of-use race.
  const estimateNumber = DRAFT_QUOTATION_NUMBER;

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
      totalEnclosedAreaSqft,
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
      headRoomAreaSqft,
      headRoomRatePerSqft,
      headRoomCost,
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
    disclaimers: [...STANDARD_EXCLUSIONS],
  };

  // 8. Immutable DB Persistence if requested
  if (optionsConfig.persist) {
    // Claim the number by inserting it and let the unique index on
    // estimates.estimate_number arbitrate. Two concurrent submissions previously
    // read the same highest number, both found it free, and the second died on an
    // unhandled 23505 after the customer had already been shown a total. On a
    // collision we simply take the next number.
    //
    // One transaction throughout: an estimate with no line items, or with no CRM
    // lead attached, is a half-written quotation, and a losing attempt must leave
    // nothing behind for the retry to trip over.
    const MAX_NUMBERING_ATTEMPTS = 10;
    let claimedNumber: string | null = null;

    // One token per quotation, generated once rather than per attempt: a losing
    // attempt rolls back, so reusing the token across retries is safe and keeps
    // the value returned to the caller identical to the one that was stored.
    const accessToken = generateEstimateAccessToken();
    const accessTokenExpiresAt = quotationLinkExpiry();
    result.accessToken = accessToken;

    for (let attempt = 0; attempt < MAX_NUMBERING_ATTEMPTS; attempt++) {
      const candidateNumber = await nextQuotationNumber(QUOTATION_CHANNELS.ONLINE, attempt);
      // The stored snapshot has to carry the number it was actually issued under.
      result.estimateNumber = candidateNumber;

      try {
        await db.transaction(async (tx) => {
          const [insertedEstimate] = await tx
            .insert(estimates)
            .values({
              estimateNumber: candidateNumber,
              accessToken,
              accessTokenExpiresAt,
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
              headRoomAreaSqft: headRoomAreaSqft.toFixed(2),
              headRoomCost: headRoomCost.toFixed(2),
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

          // Insert customization items
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

          // Insert addon items
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

          // Auto-create CRM Lead Enquiry for this authoritative estimate
          await tx.insert(enquiries).values({
            estimateId: insertedEstimate.id,
            estimateNumber: candidateNumber,
            fullName: input.customerName,
            phone: input.customerPhone,
            email: input.customerEmail ?? '',
            plotLocation: input.plotLocation,
            preferredContactTime: 'Anytime',
            requirementNotes: `Generated estimate for ${pkg.name} (${totalBuiltupAreaSqft.toFixed(0)} sq.ft, ${input.floorCount === 0 ? 'Ground Floor' : `G+${input.floorCount}`}) in ${input.plotLocation}. Total: ₹${totalProjectCost.toLocaleString('en-IN')}`,
            status: 'NEW',
          });
        });

        claimedNumber = candidateNumber;
        break;
      } catch (error) {
        if (isQuotationNumberCollision(error)) continue;
        throw error;
      }
    }

    if (claimedNumber === null) {
      throw new QuotationNumberUnavailableError(MAX_NUMBERING_ATTEMPTS);
    }
  }

  return result;
}

import { Request, Response, NextFunction } from 'express';
import {
  db,
  locations,
  packages,
  packagePrices,
  categories,
  items,
  options,
  packageItems,
  optionPrices,
  addons,
  addonPrices,
  estimates,
  eq,
  and,
  asc,
  desc,
  isNull,
  or,
} from '@asthiwar/database';
import { calculateEstimate, activePriceCondition } from './calculator.service.js';
import { CalculatorInput } from './calculator.types.js';

// ---------------------------------------------------------------------------
// 1. GET /api/v1/calculator/locations
// ---------------------------------------------------------------------------

export async function getLocations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const locRows = await db
      .select({
        id: locations.id,
        name: locations.name,
        slug: locations.slug,
        priceMultiplier: locations.priceMultiplier,
        sortOrder: locations.sortOrder,
      })
      .from(locations)
      .where(eq(locations.isActive, true))
      .orderBy(asc(locations.sortOrder));

    res.json({
      success: true,
      data: locRows.map((l) => ({
        id: l.id,
        name: l.name,
        slug: l.slug,
        priceMultiplier: Number(l.priceMultiplier),
        sortOrder: l.sortOrder,
      })),
    });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------------
// 2. GET /api/v1/calculator/packages
// ---------------------------------------------------------------------------

export async function getPackages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const pkgRows = await db
      .select({
        id: packages.id,
        slug: packages.slug,
        name: packages.name,
        tagline: packages.tagline,
        description: packages.description,
        colorTheme: packages.colorTheme,
        sortOrder: packages.sortOrder,
        pricePerSqft: packagePrices.pricePerSqft,
        volumeDiscountThresholdSqft: packagePrices.volumeDiscountThresholdSqft,
        volumePricePerSqft: packagePrices.volumePricePerSqft,
      })
      .from(packages)
      .innerJoin(packagePrices, eq(packagePrices.packageId, packages.id))
      .where(
        and(
          eq(packages.isActive, true),
          // Price tables are append-only history; without this the join returns
          // one row per retired price version as well as the current one.
          activePriceCondition(packagePrices)
        )
      )
      .orderBy(asc(packages.sortOrder), desc(packagePrices.effectiveFrom));

    // Defence in depth: exactly one entry per package. The active-price filter above
    // should already guarantee this, but a package must never appear twice in the
    // catalogue even if two rows are somehow active. Ordered newest-first, so the
    // first occurrence is the current price.
    const seen = new Set<number>();
    const currentPkgRows = pkgRows.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });

    res.json({
      success: true,
      data: currentPkgRows.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        tagline: p.tagline,
        description: p.description,
        colorTheme: p.colorTheme,
        sortOrder: p.sortOrder,
        standardPricePerSqft: Number(p.pricePerSqft),
        volumePricePerSqft: Number(p.volumePricePerSqft),
        volumeDiscountThresholdSqft: p.volumeDiscountThresholdSqft,
        pricing: {
          standardRatePerSqft: Number(p.pricePerSqft),
          volumeDiscountThresholdSqft: p.volumeDiscountThresholdSqft,
          volumeRatePerSqft: Number(p.volumePricePerSqft),
        },
      })),
    });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------------
// 3. GET /api/v1/calculator/config/:packageSlug
// ---------------------------------------------------------------------------

export async function getPackageConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const packageSlug = String(req.params.packageSlug);

    // Fetch package
    const pkgRows = await db
      .select()
      .from(packages)
      .where(and(eq(packages.slug, packageSlug), eq(packages.isActive, true)))
      .limit(1);

    if (pkgRows.length === 0) {
      res.status(404).json({
        success: false,
        error: {
          code: 'PACKAGE_NOT_FOUND',
          message: `Package with slug '${packageSlug}' not found`,
        },
      });
      return;
    }

    const pkg = pkgRows[0];

    // Fetch all categories
    const catRows = await db
      .select()
      .from(categories)
      .orderBy(asc(categories.sortOrder));

    // Fetch all items with package item rules
    const itemRows = await db
      .select({
        itemId: items.id,
        categoryId: items.categoryId,
        itemSlug: items.slug,
        itemName: items.name,
        description: items.description,
        unit: items.unit,
        isCustomizable: items.isCustomizable,
        sortOrder: items.sortOrder,
        defaultOptionId: packageItems.defaultOptionId,
        includedCoverage: packageItems.includedCoverage,
        isIncluded: packageItems.isIncluded,
        additionalCostPrice: packageItems.additionalCostPrice,
      })
      .from(items)
      .leftJoin(
        packageItems,
        and(eq(packageItems.itemId, items.id), eq(packageItems.packageId, pkg.id))
      )
      .orderBy(asc(items.sortOrder));

    // Fetch options for customizable items (including universal prices)
    const optRows = await db
      .select({
        id: options.id,
        itemId: options.itemId,
        slug: options.slug,
        brandName: options.brandName,
        specification: options.specification,
        isDefault: options.isDefault,
        priceDelta: optionPrices.priceDelta,
        priceType: optionPrices.priceType,
        packageId: optionPrices.packageId,
      })
      .from(options)
      .leftJoin(
        optionPrices,
        and(
          eq(optionPrices.optionId, options.id),
          or(eq(optionPrices.packageId, pkg.id), isNull(optionPrices.packageId)),
          activePriceCondition(optionPrices)
        )
      );

    // Prioritize package-specific option price over universal price
    const optionPricePriorityMap = new Map<number, typeof optRows[0]>();
    for (const opt of optRows) {
      const existing = optionPricePriorityMap.get(opt.id);
      if (!existing || (opt.packageId !== null && existing.packageId === null)) {
        optionPricePriorityMap.set(opt.id, opt);
      }
    }
    const deduplicatedOptRows = Array.from(optionPricePriorityMap.values());

    // Group items under categories
    const categoriesMap = catRows.map((cat) => {
      const catItems = itemRows
        .filter((it) => it.categoryId === cat.id)
        .map((it) => {
          const itemOptions = deduplicatedOptRows
            .filter((opt) => opt.itemId === it.itemId)
            .map((opt) => ({
              id: opt.id,
              slug: opt.slug,
              brandName: opt.brandName,
              specification: opt.specification,
              isPackageDefault: it.defaultOptionId === opt.id,
              priceDelta: opt.priceDelta ? Number(opt.priceDelta) : 0,
              priceType: opt.priceType ?? 'per_sqft',
            }));

          return {
            id: it.itemId,
            slug: it.itemSlug,
            name: it.itemName,
            description: it.description,
            unit: it.unit,
            isCustomizable: it.isCustomizable,
            isIncluded: it.isIncluded ?? true,
            includedCoverage: it.includedCoverage,
            additionalCostPrice: it.additionalCostPrice ? Number(it.additionalCostPrice) : 0,
            defaultOptionId: it.defaultOptionId,
            options: itemOptions,
          };
        });

      return {
        id: cat.id,
        slug: cat.slug,
        name: cat.name,
        items: catItems,
      };
    });

    // Fetch 15 Add-Ons with active prices
    const addonRows = await db
      .select()
      .from(addons)
      .where(eq(addons.isActive, true))
      .orderBy(asc(addons.sortOrder));

    const addonPriceRows = await db
      .select()
      .from(addonPrices)
      .where(activePriceCondition(addonPrices));

    // Every variant is offered, including tier-named ones. The overhead concrete
    // tank carries a Basic/Standard rate and a Premium/Luxury rate and the customer
    // picks either — the tier is part of the variant's name, not a filter.
    // `calculateEstimate` prices whichever variant slug comes back.
    const addonsData = addonRows.map((ad) => {
      const variants = addonPriceRows
        .filter((p) => p.addonId === ad.id)
        .map((p) => ({
          variantSlug: p.variantSlug,
          variantName: p.variantName,
          packageTier: p.packageTier,
          price: Number(p.price),
        }));

      return {
        id: ad.id,
        slug: ad.slug,
        name: ad.name,
        description: ad.description,
        pricingUnit: ad.pricingUnit,
        allowsMultiple: ad.allowsMultiple,
        defaultQuantity: ad.defaultQuantity ? Number(ad.defaultQuantity) : null,
        minQuantity: ad.minQuantity ? Number(ad.minQuantity) : null,
        maxQuantity: ad.maxQuantity ? Number(ad.maxQuantity) : null,
        variants,
      };
    });

    res.json({
      success: true,
      data: {
        package: {
          id: pkg.id,
          slug: pkg.slug,
          name: pkg.name,
          tagline: pkg.tagline,
          description: pkg.description,
          colorTheme: pkg.colorTheme,
        },
        specifications: categoriesMap,
        addons: addonsData,
      },
    });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------------
// 4. POST /api/v1/calculator/preview
// ---------------------------------------------------------------------------

import { logAuditEvent } from '../../services/audit.service.js';

export async function previewEstimate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = req.body as CalculatorInput;
    const result = await calculateEstimate(input, { persist: false });

    logAuditEvent({
      eventType: 'CALCULATOR_SUBMISSION',
      action: 'ESTIMATE_PREVIEW_CALCULATED',
      severity: 'LOW',
      actorType: 'ANONYMOUS_USER',
      endpoint: req.originalUrl,
      httpMethod: req.method,
      statusCode: 200,
      metadata: {
        package: input.packageSlug,
        location: input.plotLocation,
        totalCost: result.breakdown.totalProjectCost,
      },
      ipAddress: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    }).catch(() => {});

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------------
// 5. POST /api/v1/calculator/estimate
// ---------------------------------------------------------------------------

export async function createEstimate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = req.body as CalculatorInput;
    const result = await calculateEstimate(input, { persist: true });

    logAuditEvent({
      eventType: 'CALCULATOR_SUBMISSION',
      action: 'AUTHORITATIVE_ESTIMATE_CREATED',
      severity: 'INFO',
      actorType: 'ANONYMOUS_USER',
      actorId: input.customerPhone,
      endpoint: req.originalUrl,
      httpMethod: req.method,
      statusCode: 201,
      metadata: {
        estimateNumber: result.estimateNumber,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        package: input.packageSlug,
        location: input.plotLocation,
        totalCost: result.breakdown.totalProjectCost,
      },
      ipAddress: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    }).catch(() => {});

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------------
// 6. GET /api/v1/calculator/estimate/:estimateNumber
// ---------------------------------------------------------------------------

export async function getEstimateByNumber(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const estimateNumber = String(req.params.estimateNumber);

    const estRows = await db
      .select()
      .from(estimates)
      .where(eq(estimates.estimateNumber, estimateNumber.toUpperCase().trim()))
      .limit(1);

    if (estRows.length === 0) {
      res.status(404).json({
        success: false,
        error: {
          code: 'ESTIMATE_NOT_FOUND',
          message: `Estimate with number '${estimateNumber}' was not found`,
        },
      });
      return;
    }

    const est = estRows[0];

    res.json({
      success: true,
      data: est.fullSnapshotJson,
    });
  } catch (error) {
    next(error);
  }
}

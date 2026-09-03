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
  isNull,
  or,
} from '@asthiwar/database';
import { calculateEstimate } from './calculator.service.js';
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
        eq(packages.isActive, true)
      )
      .orderBy(asc(packages.sortOrder));

    res.json({
      success: true,
      data: pkgRows.map((p) => ({
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

    // Fetch options for customizable items for the active package tier
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
          eq(optionPrices.packageId, pkg.id)
        )
      );

    const deduplicatedOptRows = optRows;

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

    const tierFilter = ['all', pkg.slug === 'basic' || pkg.slug === 'standard' ? 'basic_standard' : 'premium_luxury'];

    const addonPriceRows = await db
      .select()
      .from(addonPrices);

    const addonsData = addonRows.map((ad) => {
      const variants = addonPriceRows
        .filter((p) => p.addonId === ad.id && tierFilter.includes(p.packageTier))
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

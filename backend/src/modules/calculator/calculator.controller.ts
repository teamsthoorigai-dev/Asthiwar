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
  sql,
} from '@asthiwar/database';
import { packageTierApplies, packageTierSpecificity } from '../../services/addon-tiers.js';
import { estimateRefCandidates } from './quotation.js';
import { calculateEstimate } from './calculator.service.js';
import { CalculatorInput } from './calculator.types.js';

export const DEFAULT_PACKAGE_HIGHLIGHTS: Record<string, string[]> = {
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

    // Deduplicate by slug
    const uniqueLocsMap = new Map<string, typeof locRows[0]>();
    for (const l of locRows) {
      if (!uniqueLocsMap.has(l.slug)) {
        uniqueLocsMap.set(l.slug, l);
      }
    }

    res.json({
      success: true,
      data: Array.from(uniqueLocsMap.values()).map((l) => ({
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
        highlights: packages.highlights,
        isRecommended: packages.isRecommended,
        colorTheme: packages.colorTheme,
        sortOrder: packages.sortOrder,
        pricePerSqft: packagePrices.pricePerSqft,
        volumeDiscountThresholdSqft: packagePrices.volumeDiscountThresholdSqft,
        volumePricePerSqft: packagePrices.volumePricePerSqft,
      })
      .from(packages)
      .innerJoin(
        packagePrices,
        and(
          eq(packagePrices.packageId, packages.id),
          or(isNull(packagePrices.effectiveTo), sql`${packagePrices.effectiveTo} > NOW()`)
        )
      )
      .where(
        eq(packages.isActive, true)
      )
      .orderBy(asc(packages.sortOrder), desc(packagePrices.id));

    // Deduplicate by slug to ensure exactly one package card per tier
    const uniquePkgsMap = new Map<string, any>();
    for (const p of pkgRows) {
      if (!uniquePkgsMap.has(p.slug)) {
        const highlights = (p.highlights && Array.isArray(p.highlights) && p.highlights.length > 0)
          ? p.highlights
          : (DEFAULT_PACKAGE_HIGHLIGHTS[p.slug] || []);

        uniquePkgsMap.set(p.slug, {
          id: p.id,
          slug: p.slug,
          name: p.name,
          tagline: p.tagline,
          description: p.description,
          highlights,
          isRecommended: p.isRecommended ?? (p.slug === 'premium'),
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
        });
      }
    }

    res.json({
      success: true,
      data: Array.from(uniquePkgsMap.values()),
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

    // Deduplicate itemRows by itemId to guarantee no duplicate specification rows
    const seenItemIds = new Set<number>();
    const deduplicatedItemRows = itemRows.filter((it) => {
      if (seenItemIds.has(it.itemId)) return false;
      seenItemIds.add(it.itemId);
      return true;
    });

    // Group items under categories
    const categoriesMap = catRows.map((cat) => {
      const catItems = deduplicatedItemRows
        .filter((it) => it.categoryId === cat.id)
        .map((it) => {
          const seenOptionSlugs = new Set<string>();
          const itemOptions = deduplicatedOptRows
            .filter((opt) => opt.itemId === it.itemId)
            .filter((opt) => {
              if (seenOptionSlugs.has(opt.slug)) return false;
              seenOptionSlugs.add(opt.slug);
              return true;
            })
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

    // Fetch 15 Add-Ons with active prices only
    const addonRows = await db
      .select()
      .from(addons)
      .where(eq(addons.isActive, true))
      .orderBy(asc(addons.sortOrder));

    const addonPriceRows = await db
      .select()
      .from(addonPrices)
      .where(or(isNull(addonPrices.effectiveTo), sql`${addonPrices.effectiveTo} > NOW()`));

    const addonsData = addonRows.map((ad) => {
      const matchingPrices = addonPriceRows
        .filter((p) => p.addonId === ad.id && packageTierApplies(p.packageTier, pkg.slug));

      // Strictly deduplicate variants by variantSlug: where two rows both apply
      // to this package, the more narrowly scoped one wins over a blanket 'all'.
      const variantMap = new Map<string, {
        variantSlug: string;
        variantName: string;
        packageTier: string;
        price: number;
      }>();

      for (const p of matchingPrices) {
        const existing = variantMap.get(p.variantSlug);
        if (
          !existing ||
          packageTierSpecificity(p.packageTier) < packageTierSpecificity(existing.packageTier)
        ) {
          variantMap.set(p.variantSlug, {
            variantSlug: p.variantSlug,
            variantName: p.variantName,
            packageTier: p.packageTier,
            price: Number(p.price),
          });
        }
      }

      const variants = Array.from(variantMap.values());

      return {
        id: ad.id,
        slug: ad.slug,
        name: ad.name,
        description: ad.description,
        pricingUnit: ad.pricingUnit,
        allowsMultiple: Boolean(ad.allowsMultiple),
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

    // Accepts both the printed number (AW/2026/O/0001, percent-encoded in the
    // path) and its URL-safe spelling (AW-2026-O-0001).
    let estRows: Array<typeof estimates.$inferSelect> = [];
    for (const candidate of estimateRefCandidates(estimateNumber.toUpperCase())) {
      estRows = await db
        .select()
        .from(estimates)
        .where(eq(estimates.estimateNumber, candidate))
        .limit(1);
      if (estRows.length > 0) break;
    }

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

// ---------------------------------------------------------------------------
// 7. GET /api/v1/calculator/matrix
// Fetches authoritative specification comparison matrix across all 4 tiers from DB
// ---------------------------------------------------------------------------

export async function getComparisonMatrix(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const pkgs = await db
      .select()
      .from(packages)
      .where(eq(packages.isActive, true))
      .orderBy(asc(packages.sortOrder));

    const cats = await db
      .select()
      .from(categories)
      .orderBy(asc(categories.sortOrder));

    const allItems = await db
      .select()
      .from(items)
      .orderBy(asc(items.sortOrder));

    const allPkgItems = await db.select().from(packageItems);
    const allOptions = await db.select().from(options);

    const matrix = allItems.map((item) => {
      const cat = cats.find((c) => c.id === item.categoryId);
      const tierValues: Record<string, string> = {};

      for (const p of pkgs) {
        const pi = allPkgItems.find((x) => x.packageId === p.id && x.itemId === item.id);
        const opt = allOptions.find((x) => x.id === pi?.defaultOptionId);

        let displayVal = opt ? opt.brandName : '—';
        if (opt && opt.specification) {
          displayVal = `${opt.brandName} (${opt.specification})`;
        }
        tierValues[p.slug] = displayVal;
      }

      return {
        id: item.id,
        slug: item.slug,
        name: item.name,
        category: cat ? cat.name : 'General',
        categorySlug: cat ? cat.slug : 'general',
        basic: tierValues['basic'] || '—',
        standard: tierValues['standard'] || '—',
        premium: tierValues['premium'] || '—',
        luxury: tierValues['luxury'] || '—',
      };
    });

    res.json({
      success: true,
      data: matrix,
    });
  } catch (error) {
    next(error);
  }
}


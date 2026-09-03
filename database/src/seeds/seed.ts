/**
 * ASTHIWAR — Master Data Seed Script (Phase 3)
 *
 * Seeds 100% of the approved business data from:
 *   - temp/asthiwar_requirements_and_packages.md
 *   - temp/Asthiwar Requirements/
 *   - temp/Construction Packages/
 *
 * Run via: npm run db:seed (from database/ directory)
 *
 * Rules enforced (per .agents/rules/asthiwar-project.md):
 *   - No invented prices. Every value traceable to source documents.
 *   - Idempotent: uses ON CONFLICT DO NOTHING for slug-keyed tables.
 *   - Admin password is bcrypt-hashed. Never stored in plain text.
 *   - Price history maintained with effectiveFrom timestamps.
 */

import { db, pool } from '../db';
import {
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
  adminUsers,
} from '../schema/index';
import { eq, isNull } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function log(section: string, count: number) {
  console.log(`  ✅ ${section}: ${count} row(s) inserted`);
}

// ---------------------------------------------------------------------------
// 1. LOCATIONS
// ---------------------------------------------------------------------------

async function seedLocations() {
  const locs = [
    { name: 'Coimbatore', slug: 'coimbatore', priceMultiplier: '1.0000', sortOrder: 1 },
    { name: 'Tiruppur',   slug: 'tiruppur',   priceMultiplier: '1.0000', sortOrder: 2 },
    { name: 'Erode',      slug: 'erode',      priceMultiplier: '1.0000', sortOrder: 3 },
    { name: 'Salem',      slug: 'salem',      priceMultiplier: '1.0000', sortOrder: 4 },
    { name: 'Madurai',    slug: 'madurai',    priceMultiplier: '1.0000', sortOrder: 5 },
    { name: 'Pollachi',   slug: 'pollachi',   priceMultiplier: '0.9600', sortOrder: 6 },
    { name: 'Chennai',    slug: 'chennai',    priceMultiplier: '1.0500', sortOrder: 7 },
    { name: 'Trichy',     slug: 'trichy',     priceMultiplier: '1.0000', sortOrder: 8 },
  ];

  const existingLocs = await db.select({ slug: locations.slug }).from(locations);
  const existingLocSlugs = new Set(existingLocs.map(l => l.slug));
  const locsToInsert = locs.filter(l => !existingLocSlugs.has(l.slug));
  let locCount = 0;
  if (locsToInsert.length > 0) {
    const inserted = await db.insert(locations).values(locsToInsert).returning();
    locCount = inserted.length;
  }
  log('Locations', locCount);
}

// ---------------------------------------------------------------------------
// 2. PACKAGES + PACKAGE PRICES
// ---------------------------------------------------------------------------

async function seedPackages() {
  const pkgs = [
    {
      slug: 'basic',
      name: 'Basic Package',
      tagline: 'Entry Level',
      description: 'Essential specifications for budget-conscious construction with verified quality materials.',
      colorTheme: '#2D3748',
      sortOrder: 1,
    },
    {
      slug: 'standard',
      name: 'Standard Package',
      tagline: 'Budget Friendly',
      description: 'Popular residential specifications with premium ISI brand materials and enhanced finishes.',
      colorTheme: '#C8A97E',
      sortOrder: 2,
    },
    {
      slug: 'premium',
      name: 'Premium Package',
      tagline: 'Quality Living',
      description: 'Superior quality materials, architectural fittings, and luxury brand specifications.',
      colorTheme: '#1A365D',
      sortOrder: 3,
    },
    {
      slug: 'luxury',
      name: 'Luxury Package',
      tagline: 'Ultra Premium',
      description: 'The pinnacle of bespoke residential construction with imported marble, premium fixtures, and smart home provisions.',
      colorTheme: '#744210',
      sortOrder: 4,
    },
  ];

  const existingPkgs = await db.select({ slug: packages.slug }).from(packages);
  const existingPkgSlugs = new Set(existingPkgs.map(p => p.slug));
  const pkgsToInsert = pkgs.filter(p => !existingPkgSlugs.has(p.slug));
  let pkgCount = 0;
  if (pkgsToInsert.length > 0) {
    const inserted = await db.insert(packages).values(pkgsToInsert).returning();
    pkgCount = inserted.length;
  }
  log('Packages', pkgCount);

  // Fetch inserted IDs by slug
  const pkgRows = await db.select().from(packages);
  const idBySlug: Record<string, number> = {};
  for (const p of pkgRows) idBySlug[p.slug] = p.id;

  // Package prices — source: requirements §4
  const prices = [
    // Basic: ₹2,099 / ₹2,000
    {
      packageId: idBySlug['basic'],
      pricePerSqft: '2099.00',
      volumeDiscountThresholdSqft: 3500,
      volumePricePerSqft: '2000.00',
    },
    // Standard: ₹2,468 / ₹2,357
    {
      packageId: idBySlug['standard'],
      pricePerSqft: '2468.00',
      volumeDiscountThresholdSqft: 3500,
      volumePricePerSqft: '2357.00',
    },
    // Premium: ₹2,899 / ₹2,799
    {
      packageId: idBySlug['premium'],
      pricePerSqft: '2899.00',
      volumeDiscountThresholdSqft: 3500,
      volumePricePerSqft: '2799.00',
    },
    // Luxury: ₹3,250 / ₹3,200
    {
      packageId: idBySlug['luxury'],
      pricePerSqft: '3250.00',
      volumeDiscountThresholdSqft: 3500,
      volumePricePerSqft: '3200.00',
    },
  ];

  // Idempotent: Only insert price row if package has no active price row
  const existingActive = await db
    .select({ packageId: packagePrices.packageId })
    .from(packagePrices)
    .where(isNull(packagePrices.effectiveTo));
  const activePackageIds = new Set(existingActive.map(r => r.packageId));
  
  const toInsert = prices.filter(p => !activePackageIds.has(p.packageId));
  let insertedCount = 0;
  if (toInsert.length > 0) {
    const inserted = await db.insert(packagePrices).values(toInsert).returning();
    insertedCount = inserted.length;
  }
  log('Package Prices', insertedCount);

  return idBySlug;
}

// ---------------------------------------------------------------------------
// 3. CATEGORIES
// ---------------------------------------------------------------------------

async function seedCategories() {
  const cats = [
    { slug: 'structure',      name: 'Structure & Civil',           sortOrder: 1 },
    { slug: 'design',         name: 'Design & Engineering',        sortOrder: 2 },
    { slug: 'management',     name: 'Construction Management',     sortOrder: 3 },
    { slug: 'kitchen',        name: 'Kitchen & Plumbing',          sortOrder: 4 },
    { slug: 'bathroom',       name: 'Bathroom & Sanitary',         sortOrder: 5 },
    { slug: 'flooring',       name: 'Flooring',                    sortOrder: 6 },
    { slug: 'doors_windows',  name: 'Doors & Windows',             sortOrder: 7 },
    { slug: 'painting',       name: 'Painting',                    sortOrder: 8 },
    { slug: 'electrical',     name: 'Electrical & Utilities',      sortOrder: 9 },
    { slug: 'other',          name: 'Other Inclusions',            sortOrder: 10 },
  ];

  const existingCats = await db.select({ slug: categories.slug }).from(categories);
  const existingCatSlugs = new Set(existingCats.map(c => c.slug));
  const catsToInsert = cats.filter(c => !existingCatSlugs.has(c.slug));
  let catCount = 0;
  if (catsToInsert.length > 0) {
    const inserted = await db.insert(categories).values(catsToInsert).returning();
    catCount = inserted.length;
  }
  log('Categories', catCount);

  const rows = await db.select().from(categories);
  const idBySlug: Record<string, number> = {};
  for (const r of rows) idBySlug[r.slug] = r.id;
  return idBySlug;
}

// ---------------------------------------------------------------------------
// 4. ITEMS + OPTIONS + PACKAGE_ITEMS + OPTION_PRICES
// ---------------------------------------------------------------------------

async function seedSpecifications(
  pkgIds: Record<string, number>,
  catIds: Record<string, number>,
) {
  // -------------------------------------------------------------------------
  // Items definition (slug, categorySlug, name, unit, isCustomizable)
  // -------------------------------------------------------------------------
  const itemDefs: {
    slug: string;
    catSlug: string;
    name: string;
    unit: string;
    isCustomizable: boolean;
    sortOrder: number;
  }[] = [
    // Structure & Civil
    { slug: 'steel_rebar',       catSlug: 'structure', name: 'Steel Rebar Fe 550D',      unit: 'sqft', isCustomizable: true,  sortOrder: 1  },
    { slug: 'binding_wire',      catSlug: 'structure', name: 'Binding Wires',             unit: 'sqft', isCustomizable: true,  sortOrder: 2  },
    { slug: 'cement',            catSlug: 'structure', name: 'Cement',                    unit: 'sqft', isCustomizable: true,  sortOrder: 3  },
    { slug: 'aggregates',        catSlug: 'structure', name: 'Aggregates / Bluemetals',   unit: 'sqft', isCustomizable: false, sortOrder: 4  },
    { slug: 'masonry_work',      catSlug: 'structure', name: 'Masonry Work',              unit: 'sqft', isCustomizable: true,  sortOrder: 5  },
    { slug: 'basement_height',   catSlug: 'structure', name: 'Basement Height',           unit: 'fixed',isCustomizable: false, sortOrder: 6  },
    { slug: 'ceiling_height',    catSlug: 'structure', name: 'Ceiling Height',            unit: 'fixed',isCustomizable: false, sortOrder: 7  },
    { slug: 'waterproofing',     catSlug: 'structure', name: 'Waterproofing',             unit: 'sqft', isCustomizable: true,  sortOrder: 8  },
    { slug: 'rcc_design_mix',    catSlug: 'structure', name: 'RCC Design Mix',            unit: 'fixed',isCustomizable: false, sortOrder: 9  },
    { slug: 'basement_pcc',      catSlug: 'structure', name: 'Basement PCC / RCC',        unit: 'sqft', isCustomizable: true,  sortOrder: 10 },
    // Design & Engineering
    { slug: 'floor_plans',       catSlug: 'design', name: 'Floor Plans & Working Drawings', unit: 'fixed', isCustomizable: false, sortOrder: 1 },
    { slug: 'furniture_layout',  catSlug: 'design', name: 'Furniture Layout',             unit: 'sqft', isCustomizable: false, sortOrder: 2 },
    { slug: 'elevation_3d',      catSlug: 'design', name: '3D Elevation',                 unit: 'fixed',isCustomizable: false, sortOrder: 3 },
    { slug: 'structural_drawing',catSlug: 'design', name: 'Structural Drawing',           unit: 'sqft', isCustomizable: false, sortOrder: 4 },
    { slug: 'soil_testing',      catSlug: 'design', name: 'Soil Testing',                 unit: 'sqft', isCustomizable: false, sortOrder: 5 },
    { slug: 'site_assessment',   catSlug: 'design', name: 'Site Assessment',              unit: 'sqft', isCustomizable: false, sortOrder: 6 },
    { slug: 'electrical_drawing',catSlug: 'design', name: 'Electrical Drawings',          unit: 'sqft', isCustomizable: false, sortOrder: 7 },
    { slug: 'plumbing_drawing',  catSlug: 'design', name: 'Plumbing Drawings',            unit: 'sqft', isCustomizable: false, sortOrder: 8 },
    { slug: 'isometric_views',   catSlug: 'design', name: 'Isometric Views',              unit: 'sqft', isCustomizable: false, sortOrder: 9 },
    { slug: 'vr_3d',             catSlug: 'design', name: 'Virtual Reality (VR) 3D',      unit: 'sqft', isCustomizable: false, sortOrder: 10},
    // Construction Management
    { slug: 'online_updates',    catSlug: 'management', name: 'Online Daily Updates',      unit: 'fixed', isCustomizable: false, sortOrder: 1 },
    { slug: 'site_engineer',     catSlug: 'management', name: 'Site Engineer Supervision', unit: 'fixed', isCustomizable: false, sortOrder: 2 },
    { slug: 'architect_visit',   catSlug: 'management', name: 'Architect Site Visit',      unit: 'sqft', isCustomizable: false, sortOrder: 3 },
    { slug: 'structural_eng_visit', catSlug: 'management', name: 'Structural Engineer Visit', unit: 'fixed', isCustomizable: false, sortOrder: 4 },
    // Kitchen
    { slug: 'kitchen_wall_tiles', catSlug: 'kitchen', name: 'Kitchen Wall Tiles',        unit: 'sqft', isCustomizable: false, sortOrder: 1 },
    { slug: 'granite_countertop', catSlug: 'kitchen', name: 'Granite Countertop',        unit: 'rft',  isCustomizable: false, sortOrder: 2 },
    { slug: 'kitchen_sink',      catSlug: 'kitchen', name: 'Kitchen Sink',                unit: 'fixed',isCustomizable: false, sortOrder: 3 },
    { slug: 'kitchen_faucets',   catSlug: 'kitchen', name: 'Kitchen Faucets',             unit: 'fixed',isCustomizable: false, sortOrder: 4 },
    // Bathroom & Sanitary
    { slug: 'bathroom_wall_tiles',catSlug: 'bathroom', name: 'Bathroom Wall Tiles',       unit: 'sqft', isCustomizable: false, sortOrder: 1 },
    { slug: 'sanitaryware',      catSlug: 'bathroom', name: 'Sanitaryware',               unit: 'fixed',isCustomizable: false, sortOrder: 2 },
    { slug: 'cp_fittings',       catSlug: 'bathroom', name: 'CP Fittings',                unit: 'fixed',isCustomizable: false, sortOrder: 3 },
    { slug: 'bathroom_doors',    catSlug: 'bathroom', name: 'Bathroom Doors',             unit: 'fixed',isCustomizable: false, sortOrder: 4 },
    // Flooring
    { slug: 'living_dining_flooring', catSlug: 'flooring', name: 'Living & Dining Flooring', unit: 'sqft', isCustomizable: false, sortOrder: 1 },
    { slug: 'bedroom_flooring',   catSlug: 'flooring', name: 'Bedroom Flooring',           unit: 'sqft', isCustomizable: false, sortOrder: 2 },
    { slug: 'staircase_flooring', catSlug: 'flooring', name: 'Staircase Flooring',         unit: 'sqft', isCustomizable: false, sortOrder: 3 },
    { slug: 'parking_flooring',    catSlug: 'flooring', name: 'Parking Flooring',        unit: 'sqft', isCustomizable: false, sortOrder: 4 },
    // Doors & Windows
    { slug: 'main_door',           catSlug: 'doors_windows', name: 'Main Door',          unit: 'fixed',isCustomizable: false, sortOrder: 1 },
    { slug: 'internal_doors',      catSlug: 'doors_windows', name: 'Internal Doors',     unit: 'fixed',isCustomizable: false, sortOrder: 2 },
    { slug: 'windows',             catSlug: 'doors_windows', name: 'Windows',            unit: 'fixed',isCustomizable: false, sortOrder: 3 },
    // Painting
    { slug: 'interior_painting',   catSlug: 'painting', name: 'Interior Painting',       unit: 'sqft', isCustomizable: true,  sortOrder: 1 },
    { slug: 'exterior_painting',   catSlug: 'painting', name: 'Exterior Painting',       unit: 'sqft', isCustomizable: true,  sortOrder: 2 },
    // Electrical & Utilities
    { slug: 'wires_switches',      catSlug: 'electrical', name: 'Wires & Switches',      unit: 'sqft', isCustomizable: true,  sortOrder: 1 },
    { slug: 'lights',              catSlug: 'electrical', name: 'Lights',                unit: 'sqft', isCustomizable: true,  sortOrder: 2 },
    { slug: 'ceiling_fans',        catSlug: 'electrical', name: 'Ceiling Fans',          unit: 'sqft', isCustomizable: false, sortOrder: 3 },
    { slug: 'overhead_tank',       catSlug: 'electrical', name: 'Overhead Tank',         unit: 'fixed',isCustomizable: false, sortOrder: 4 },
    { slug: 'railings',            catSlug: 'electrical', name: 'Railings',              unit: 'fixed',isCustomizable: false, sortOrder: 5 },
    { slug: 'parapet_wall',        catSlug: 'electrical', name: 'Parapet Wall',          unit: 'fixed',isCustomizable: false, sortOrder: 6 },
    { slug: 'roof_weathering',     catSlug: 'electrical', name: 'Roof Weathering',       unit: 'sqft', isCustomizable: false, sortOrder: 7 },
    { slug: 'lofts_shelves',       catSlug: 'electrical', name: 'Lofts & Shelves',       unit: 'sqft', isCustomizable: false, sortOrder: 8 },
    { slug: 'false_ceiling',       catSlug: 'electrical', name: 'False Ceiling',         unit: 'sqft', isCustomizable: false, sortOrder: 9 },
    // Other
    { slug: 'anti_termite',        catSlug: 'other', name: 'Anti-Termite & Earthing',    unit: 'fixed',isCustomizable: false, sortOrder: 1 },
  ];

  const itemInserts = itemDefs.map((d) => ({
    categoryId: catIds[d.catSlug],
    slug: d.slug,
    name: d.name,
    unit: d.unit,
    isCustomizable: d.isCustomizable,
    sortOrder: d.sortOrder,
  }));

  const existingItems = await db.select({ slug: items.slug }).from(items);
  const existingItemSlugs = new Set(existingItems.map(i => i.slug));
  const itemsToInsert = itemInserts.filter(i => !existingItemSlugs.has(i.slug));
  let itemCount = 0;
  if (itemsToInsert.length > 0) {
    const inserted = await db.insert(items).values(itemsToInsert).returning();
    itemCount = inserted.length;
  }
  log('Items', itemCount);

  // Fetch item IDs
  const itemRows = await db.select().from(items);
  const itemIdBySlug: Record<string, number> = {};
  for (const r of itemRows) itemIdBySlug[r.slug] = r.id;

  // -------------------------------------------------------------------------
  // OPTIONS — brand choices per item
  // Source: requirements §5 (A–F)
  // -------------------------------------------------------------------------
  const optionDefs: {
    itemSlug: string;
    slug: string;
    brandName: string;
    specification?: string;
    isDefault: boolean;
  }[] = [
    // Steel Rebar
    { itemSlug: 'steel_rebar', slug: 'any_isi_steel',     brandName: 'Any ISI Brand',               isDefault: true  },
    { itemSlug: 'steel_rebar', slug: 'spa_vizag_steel',   brandName: 'SPA / Vizag',                 isDefault: false },
    { itemSlug: 'steel_rebar', slug: 'ars_suryadev_steel',brandName: 'ARS / Suryadev / Sumangala',  isDefault: false },
    { itemSlug: 'steel_rebar', slug: 'jsw_tata_steel',    brandName: 'JSW / TATA',                  isDefault: false },
    // Binding Wire
    { itemSlug: 'binding_wire', slug: 'any_isi_wire',     brandName: 'Any ISI Brand',               isDefault: true  },
    { itemSlug: 'binding_wire', slug: 'tata_wire',        brandName: 'TATA',                        isDefault: false },
    // Cement
    { itemSlug: 'cement', slug: 'any_isi_cement',         brandName: 'Any ISI Brand',               isDefault: true  },
    { itemSlug: 'cement', slug: 'jsw_cement',             brandName: 'JSW',                         isDefault: false },
    { itemSlug: 'cement', slug: 'ramco_dalmia_cement',    brandName: 'Ramco / Dalmia',              isDefault: false },
    { itemSlug: 'cement', slug: 'ultratech_chettinad',    brandName: 'Ultratech / Chettinad',       isDefault: false },
    // Masonry Work
    { itemSlug: 'masonry_work', slug: 'solid_block',      brandName: 'Solid Concrete Block (6" / 4")', isDefault: true  },
    { itemSlug: 'masonry_work', slug: 'flyash_aac',       brandName: 'Fly Ash / AAC Block (9" / 4.5")',isDefault: false },
    { itemSlug: 'masonry_work', slug: 'red_brick',        brandName: 'Wirecut Red Bricks (9" / 4.5")', isDefault: false },
    // Waterproofing
    { itemSlug: 'waterproofing', slug: 'dr_fixit',        brandName: 'Dr. Fixit / Fosroc',          isDefault: true  },
    // Basement PCC / RCC
    { itemSlug: 'basement_pcc', slug: 'pcc_basement',     brandName: 'PCC Basement Floor',          isDefault: true  },
    { itemSlug: 'basement_pcc', slug: 'rcc_basement',     brandName: 'RCC Basement Floor',          isDefault: false },
    // Interior Painting
    { itemSlug: 'interior_painting', slug: 'isi_emulsion', brandName: 'Any ISI Emulsion',           isDefault: true  },
    { itemSlug: 'interior_painting', slug: 'asian_tractor',brandName: 'Asian Paints Tractor Emulsion', isDefault: false },
    { itemSlug: 'interior_painting', slug: 'asian_premium',brandName: 'Asian Paints Premium Emulsion', isDefault: false },
    { itemSlug: 'interior_painting', slug: 'asian_royale', brandName: 'Asian Paints Royale Emulsion',  isDefault: false },
    // Exterior Painting
    { itemSlug: 'exterior_painting', slug: 'isi_exterior', brandName: 'Any ISI Exterior Emulsion',  isDefault: true  },
    { itemSlug: 'exterior_painting', slug: 'asian_ace',    brandName: 'Asian Paints Ace',            isDefault: false },
    { itemSlug: 'exterior_painting', slug: 'asian_apex',   brandName: 'Asian Paints Apex',           isDefault: false },
    { itemSlug: 'exterior_painting', slug: 'ultima_protek',brandName: 'Asian Paints Apex Ultima Protek', isDefault: false },
    // Wires & Switches
    { itemSlug: 'wires_switches', slug: 'isi_switches',    brandName: 'Any ISI Wires & Switches',   isDefault: true  },
    { itemSlug: 'wires_switches', slug: 'rr_anchor_roma',  brandName: 'RR Kabel / Anchor Roma',     isDefault: false },
    { itemSlug: 'wires_switches', slug: 'finolex_legrand', brandName: 'Finolex / Legrand',          isDefault: false },
    // Lights
    { itemSlug: 'lights', slug: 'any_isi_lights',         brandName: 'Any ISI Lights',              isDefault: true  },
    { itemSlug: 'lights', slug: 'luker_lights',           brandName: 'Luker',                       isDefault: false },
    { itemSlug: 'lights', slug: 'philips_lights',         brandName: 'Philips',                     isDefault: false },
  ];

  const optionInserts = optionDefs.map((d) => ({
    itemId: itemIdBySlug[d.itemSlug],
    slug: d.slug,
    brandName: d.brandName,
    specification: d.specification ?? null,
    isDefault: d.isDefault,
  }));

  const existingOptions = await db.select({ slug: options.slug }).from(options);
  const existingOptionSlugs = new Set(existingOptions.map(o => o.slug));
  const optionsToInsert = optionInserts.filter(o => !existingOptionSlugs.has(o.slug));
  let optionCount = 0;
  if (optionsToInsert.length > 0) {
    const inserted = await db.insert(options).values(optionsToInsert).returning();
    optionCount = inserted.length;
  }
  log('Options', optionCount);

  // Fetch option IDs
  const optionRows = await db.select().from(options);
  const optIdBySlug: Record<string, number> = {};
  for (const r of optionRows) optIdBySlug[r.slug] = r.id;

  // -------------------------------------------------------------------------
  // PACKAGE_ITEMS — default brands and "Additional Cost" flags per package
  // Source: requirements §5 (A–F) — every cell read explicitly
  // isIncluded = false + additionalCostPrice > 0 → item is an add-on cost
  // -------------------------------------------------------------------------
  type PackageItemDef = {
    pkgSlug: string;
    itemSlug: string;
    defaultOptionSlug?: string;
    includedCoverage?: string;
    isIncluded: boolean;
    additionalCostPrice: string;
  };

  const piDefs: PackageItemDef[] = [
    // ── Steel Rebar ──────────────────────────────────────────────────────────
    { pkgSlug: 'basic',     itemSlug: 'steel_rebar', defaultOptionSlug: 'any_isi_steel',      isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: 'standard',  itemSlug: 'steel_rebar', defaultOptionSlug: 'spa_vizag_steel',    isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: 'premium',   itemSlug: 'steel_rebar', defaultOptionSlug: 'ars_suryadev_steel', isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: 'luxury',    itemSlug: 'steel_rebar', defaultOptionSlug: 'jsw_tata_steel',     isIncluded: true, additionalCostPrice: '0.00' },
    // ── Binding Wire ─────────────────────────────────────────────────────────
    { pkgSlug: 'basic',     itemSlug: 'binding_wire', defaultOptionSlug: 'any_isi_wire', isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: 'standard',  itemSlug: 'binding_wire', defaultOptionSlug: 'tata_wire',   isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: 'premium',   itemSlug: 'binding_wire', defaultOptionSlug: 'tata_wire',   isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: 'luxury',    itemSlug: 'binding_wire', defaultOptionSlug: 'tata_wire',   isIncluded: true, additionalCostPrice: '0.00' },
    // ── Cement ───────────────────────────────────────────────────────────────
    { pkgSlug: 'basic',     itemSlug: 'cement', defaultOptionSlug: 'any_isi_cement',      isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: 'standard',  itemSlug: 'cement', defaultOptionSlug: 'jsw_cement',          isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: 'premium',   itemSlug: 'cement', defaultOptionSlug: 'ramco_dalmia_cement', isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: 'luxury',    itemSlug: 'cement', defaultOptionSlug: 'ultratech_chettinad', isIncluded: true, additionalCostPrice: '0.00' },
    // ── Aggregates (no brand choice — BSI specs only) ────────────────────────
    { pkgSlug: 'basic',     itemSlug: 'aggregates', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'BSI Specs' },
    { pkgSlug: 'standard',  itemSlug: 'aggregates', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'BSI Specs' },
    { pkgSlug: 'premium',   itemSlug: 'aggregates', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'BSI Specs' },
    { pkgSlug: 'luxury',    itemSlug: 'aggregates', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'BSI Specs' },
    // ── Masonry Work ─────────────────────────────────────────────────────────
    // Basic: Solid blocks included; Red brick +₹120/sqft
    { pkgSlug: 'basic',    itemSlug: 'masonry_work', defaultOptionSlug: 'solid_block', isIncluded: true, additionalCostPrice: '0.00'   },
    // Standard/Premium: Fly ash included; Red brick +₹100/sqft
    { pkgSlug: 'standard', itemSlug: 'masonry_work', defaultOptionSlug: 'flyash_aac',  isIncluded: true, additionalCostPrice: '0.00'   },
    { pkgSlug: 'premium',  itemSlug: 'masonry_work', defaultOptionSlug: 'flyash_aac',  isIncluded: true, additionalCostPrice: '0.00'   },
    // Luxury: Red bricks fully included
    { pkgSlug: 'luxury',   itemSlug: 'masonry_work', defaultOptionSlug: 'red_brick',   isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'Red Bricks (Included)' },
    // ── Ceiling Height (descriptive, no option) ───────────────────────────────
    { pkgSlug: 'basic',    itemSlug: 'ceiling_height', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: '9.5 ft' },
    { pkgSlug: 'standard', itemSlug: 'ceiling_height', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: '10 ft'  },
    { pkgSlug: 'premium',  itemSlug: 'ceiling_height', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: '10 ft'  },
    { pkgSlug: 'luxury',   itemSlug: 'ceiling_height', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: '11 ft'  },
    // ── Waterproofing — Basic: +₹10/sqft; rest: Dr.Fixit/Fosroc/Bostik included ──
    { pkgSlug: 'basic',    itemSlug: 'waterproofing', isIncluded: false, additionalCostPrice: '10.00' },
    { pkgSlug: 'standard', itemSlug: 'waterproofing', defaultOptionSlug: 'dr_fixit', isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: 'premium',  itemSlug: 'waterproofing', defaultOptionSlug: 'dr_fixit', isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: 'luxury',   itemSlug: 'waterproofing', defaultOptionSlug: 'dr_fixit', isIncluded: true, additionalCostPrice: '0.00' },
    // ── RCC Design Mix (descriptive) ─────────────────────────────────────────
    { pkgSlug: 'basic',    itemSlug: 'rcc_design_mix', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'M20' },
    { pkgSlug: 'standard', itemSlug: 'rcc_design_mix', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'M20' },
    { pkgSlug: 'premium',  itemSlug: 'rcc_design_mix', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'M20' },
    { pkgSlug: 'luxury',   itemSlug: 'rcc_design_mix', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'M25' },
    // ── Basement PCC/RCC — Basic/Standard/Premium: PCC; RCC +₹40; Luxury: RCC included ──
    { pkgSlug: 'basic',    itemSlug: 'basement_pcc', defaultOptionSlug: 'pcc_basement', isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: 'standard', itemSlug: 'basement_pcc', defaultOptionSlug: 'pcc_basement', isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: 'premium',  itemSlug: 'basement_pcc', defaultOptionSlug: 'pcc_basement', isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: 'luxury',   itemSlug: 'basement_pcc', defaultOptionSlug: 'rcc_basement', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'RCC (Included)' },
    // ── Design: Floor Plans — all included ───────────────────────────────────
    { pkgSlug: 'basic',    itemSlug: 'floor_plans', isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: 'standard', itemSlug: 'floor_plans', isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: 'premium',  itemSlug: 'floor_plans', isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: 'luxury',   itemSlug: 'floor_plans', isIncluded: true, additionalCostPrice: '0.00' },
    // ── Furniture Layout — Basic/Standard: +₹4/sqft; Premium/Luxury: included ──
    { pkgSlug: 'basic',    itemSlug: 'furniture_layout', isIncluded: false, additionalCostPrice: '4.00' },
    { pkgSlug: 'standard', itemSlug: 'furniture_layout', isIncluded: false, additionalCostPrice: '4.00' },
    { pkgSlug: 'premium',  itemSlug: 'furniture_layout', isIncluded: true,  additionalCostPrice: '0.00' },
    { pkgSlug: 'luxury',   itemSlug: 'furniture_layout', isIncluded: true,  additionalCostPrice: '0.00' },
    // ── 3D Elevation — all included ──────────────────────────────────────────
    { pkgSlug: 'basic',    itemSlug: 'elevation_3d', isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: 'standard', itemSlug: 'elevation_3d', isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: 'premium',  itemSlug: 'elevation_3d', isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: 'luxury',   itemSlug: 'elevation_3d', isIncluded: true, additionalCostPrice: '0.00' },
    // ── Structural Drawing — Basic: +₹6; rest included ───────────────────────
    { pkgSlug: 'basic',    itemSlug: 'structural_drawing', isIncluded: false, additionalCostPrice: '6.00' },
    { pkgSlug: 'standard', itemSlug: 'structural_drawing', isIncluded: true,  additionalCostPrice: '0.00' },
    { pkgSlug: 'premium',  itemSlug: 'structural_drawing', isIncluded: true,  additionalCostPrice: '0.00' },
    { pkgSlug: 'luxury',   itemSlug: 'structural_drawing', isIncluded: true,  additionalCostPrice: '0.00' },
    // ── Soil Testing — Basic/Standard: +₹40; Premium/Luxury: included ────────
    { pkgSlug: 'basic',    itemSlug: 'soil_testing', isIncluded: false, additionalCostPrice: '40.00' },
    { pkgSlug: 'standard', itemSlug: 'soil_testing', isIncluded: false, additionalCostPrice: '40.00' },
    { pkgSlug: 'premium',  itemSlug: 'soil_testing', isIncluded: true,  additionalCostPrice: '0.00'  },
    { pkgSlug: 'luxury',   itemSlug: 'soil_testing', isIncluded: true,  additionalCostPrice: '0.00'  },
    // ── Site Assessment — Basic/Standard: +₹10; Premium/Luxury: included ─────
    { pkgSlug: 'basic',    itemSlug: 'site_assessment', isIncluded: false, additionalCostPrice: '10.00' },
    { pkgSlug: 'standard', itemSlug: 'site_assessment', isIncluded: false, additionalCostPrice: '10.00' },
    { pkgSlug: 'premium',  itemSlug: 'site_assessment', isIncluded: true,  additionalCostPrice: '0.00'  },
    { pkgSlug: 'luxury',   itemSlug: 'site_assessment', isIncluded: true,  additionalCostPrice: '0.00'  },
    // ── Electrical Drawings — Basic/Standard: +₹6; rest included ────────────
    { pkgSlug: 'basic',    itemSlug: 'electrical_drawing', isIncluded: false, additionalCostPrice: '6.00' },
    { pkgSlug: 'standard', itemSlug: 'electrical_drawing', isIncluded: false, additionalCostPrice: '6.00' },
    { pkgSlug: 'premium',  itemSlug: 'electrical_drawing', isIncluded: true,  additionalCostPrice: '0.00' },
    { pkgSlug: 'luxury',   itemSlug: 'electrical_drawing', isIncluded: true,  additionalCostPrice: '0.00' },
    // ── Plumbing Drawings — Basic/Standard: +₹6; rest included ──────────────
    { pkgSlug: 'basic',    itemSlug: 'plumbing_drawing', isIncluded: false, additionalCostPrice: '6.00' },
    { pkgSlug: 'standard', itemSlug: 'plumbing_drawing', isIncluded: false, additionalCostPrice: '6.00' },
    { pkgSlug: 'premium',  itemSlug: 'plumbing_drawing', isIncluded: true,  additionalCostPrice: '0.00' },
    { pkgSlug: 'luxury',   itemSlug: 'plumbing_drawing', isIncluded: true,  additionalCostPrice: '0.00' },
    // ── Isometric Views — Basic/Standard: +₹8; rest included ────────────────
    { pkgSlug: 'basic',    itemSlug: 'isometric_views', isIncluded: false, additionalCostPrice: '8.00' },
    { pkgSlug: 'standard', itemSlug: 'isometric_views', isIncluded: false, additionalCostPrice: '8.00' },
    { pkgSlug: 'premium',  itemSlug: 'isometric_views', isIncluded: true,  additionalCostPrice: '0.00' },
    { pkgSlug: 'luxury',   itemSlug: 'isometric_views', isIncluded: true,  additionalCostPrice: '0.00' },
    // ── VR 3D — Basic/Standard/Premium: +₹40; Luxury: included ──────────────
    { pkgSlug: 'basic',    itemSlug: 'vr_3d', isIncluded: false, additionalCostPrice: '40.00' },
    { pkgSlug: 'standard', itemSlug: 'vr_3d', isIncluded: false, additionalCostPrice: '40.00' },
    { pkgSlug: 'premium',  itemSlug: 'vr_3d', isIncluded: false, additionalCostPrice: '40.00' },
    { pkgSlug: 'luxury',   itemSlug: 'vr_3d', isIncluded: true,  additionalCostPrice: '0.00'  },
    // ── Management: Online Updates — all daily ────────────────────────────────
    { pkgSlug: 'basic',    itemSlug: 'online_updates', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'Daily' },
    { pkgSlug: 'standard', itemSlug: 'online_updates', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'Daily' },
    { pkgSlug: 'premium',  itemSlug: 'online_updates', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'Daily' },
    { pkgSlug: 'luxury',   itemSlug: 'online_updates', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'Daily' },
    // ── Site Engineer ────────────────────────────────────────────────────────
    { pkgSlug: 'basic',    itemSlug: 'site_engineer', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'Once in 2 days'   },
    { pkgSlug: 'standard', itemSlug: 'site_engineer', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'Daily Visits'     },
    { pkgSlug: 'premium',  itemSlug: 'site_engineer', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'Full day on site' },
    { pkgSlug: 'luxury',   itemSlug: 'site_engineer', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'Full day on site' },
    // ── Architect Visit — Basic/Standard: +₹40; Premium/Luxury: before concretes ──
    { pkgSlug: 'basic',    itemSlug: 'architect_visit', isIncluded: false, additionalCostPrice: '40.00' },
    { pkgSlug: 'standard', itemSlug: 'architect_visit', isIncluded: false, additionalCostPrice: '40.00' },
    { pkgSlug: 'premium',  itemSlug: 'architect_visit', isIncluded: true,  additionalCostPrice: '0.00', includedCoverage: 'Before all concrete days' },
    { pkgSlug: 'luxury',   itemSlug: 'architect_visit', isIncluded: true,  additionalCostPrice: '0.00', includedCoverage: 'Before all concrete days' },
    // ── Structural Engineer Visit — all included ──────────────────────────────
    { pkgSlug: 'basic',    itemSlug: 'structural_eng_visit', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'Before all concrete days' },
    { pkgSlug: 'standard', itemSlug: 'structural_eng_visit', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'Before all concrete days' },
    { pkgSlug: 'premium',  itemSlug: 'structural_eng_visit', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'Before all concrete days' },
    { pkgSlug: 'luxury',   itemSlug: 'structural_eng_visit', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'Before all concrete days' },
    // ── Kitchen Wall Tiles ───────────────────────────────────────────────────
    { pkgSlug: 'basic',    itemSlug: 'kitchen_wall_tiles', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: '2.5 ft slab @ ₹35/sqft' },
    { pkgSlug: 'standard', itemSlug: 'kitchen_wall_tiles', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: '4 ft slab @ ₹45/sqft'   },
    { pkgSlug: 'premium',  itemSlug: 'kitchen_wall_tiles', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'Roof height @ ₹55/sqft'  },
    { pkgSlug: 'luxury',   itemSlug: 'kitchen_wall_tiles', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'Roof height @ ₹75/sqft'  },
    // ── Granite Countertop ───────────────────────────────────────────────────
    { pkgSlug: 'basic',    itemSlug: 'granite_countertop', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'Up to 15 rft @ ₹80/sqft'  },
    { pkgSlug: 'standard', itemSlug: 'granite_countertop', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'Up to 15 rft @ ₹100/sqft' },
    { pkgSlug: 'premium',  itemSlug: 'granite_countertop', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'Up to 20 rft @ ₹120/sqft' },
    { pkgSlug: 'luxury',   itemSlug: 'granite_countertop', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'Up to 25 rft @ ₹160/sqft' },
    // ── Kitchen Sink ─────────────────────────────────────────────────────────
    { pkgSlug: 'basic',    itemSlug: 'kitchen_sink', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'Allowance up to ₹4,000'  },
    { pkgSlug: 'standard', itemSlug: 'kitchen_sink', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'Allowance up to ₹5,000'  },
    { pkgSlug: 'premium',  itemSlug: 'kitchen_sink', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'Allowance up to ₹7,000'  },
    { pkgSlug: 'luxury',   itemSlug: 'kitchen_sink', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'Allowance up to ₹14,000' },
    // ── Bathroom Wall Tiles ──────────────────────────────────────────────────
    { pkgSlug: 'basic',    itemSlug: 'bathroom_wall_tiles', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: '7 ft @ ₹35/sqft'  },
    { pkgSlug: 'standard', itemSlug: 'bathroom_wall_tiles', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: '7 ft @ ₹45/sqft'  },
    { pkgSlug: 'premium',  itemSlug: 'bathroom_wall_tiles', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: '10 ft @ ₹55/sqft' },
    { pkgSlug: 'luxury',   itemSlug: 'bathroom_wall_tiles', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: '11 ft @ ₹75/sqft' },
    // ── Sanitary & CP Fittings ───────────────────────────────────────────────
    { pkgSlug: 'basic',    itemSlug: 'sanitary_fittings', defaultOptionSlug: 'any_isi_sanitary', isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: 'standard', itemSlug: 'sanitary_fittings', defaultOptionSlug: 'parryware',        isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'Parryware up to ₹20,000/bath' },
    { pkgSlug: 'premium',  itemSlug: 'sanitary_fittings', defaultOptionSlug: 'jaquar',           isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'Jaquar up to ₹30,000/bath'    },
    { pkgSlug: 'luxury',   itemSlug: 'sanitary_fittings', defaultOptionSlug: 'toto_kohler',      isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'Toto/Kohler up to ₹45,000/bath' },
    // ── PVC/CPVC Pipes ───────────────────────────────────────────────────────
    { pkgSlug: 'basic',    itemSlug: 'pvc_cpvc_pipes', defaultOptionSlug: 'any_isi_pipe',    isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: 'standard', itemSlug: 'pvc_cpvc_pipes', defaultOptionSlug: 'watertec',        isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: 'premium',  itemSlug: 'pvc_cpvc_pipes', defaultOptionSlug: 'kavery_ashirwad', isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: 'luxury',   itemSlug: 'pvc_cpvc_pipes', defaultOptionSlug: 'finolex_supreme', isIncluded: true, additionalCostPrice: '0.00' },
    // ── Flooring: Main ───────────────────────────────────────────────────────
    { pkgSlug: 'basic',    itemSlug: 'main_flooring', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: "2'x2' @ ₹45/sqft"     },
    { pkgSlug: 'standard', itemSlug: 'main_flooring', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: "4'x2' @ ₹50/sqft"     },
    { pkgSlug: 'premium',  itemSlug: 'main_flooring', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: "4'x2' @ ₹70/sqft"     },
    { pkgSlug: 'luxury',   itemSlug: 'main_flooring', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'Premium Tiles @ ₹100/sqft' },
    // ── Flooring: Balcony & Open Area ────────────────────────────────────────
    { pkgSlug: 'basic',    itemSlug: 'balcony_flooring', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: "1'x1' @ ₹35/sqft" },
    { pkgSlug: 'standard', itemSlug: 'balcony_flooring', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: "2'x2' @ ₹50/sqft" },
    { pkgSlug: 'premium',  itemSlug: 'balcony_flooring', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: "2'x2' @ ₹60/sqft" },
    { pkgSlug: 'luxury',   itemSlug: 'balcony_flooring', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'Tiles @ ₹85/sqft'  },
    // ── Flooring: Staircase ──────────────────────────────────────────────────
    { pkgSlug: 'basic',    itemSlug: 'staircase_flooring', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: "1'x1' @ ₹35/sqft"  },
    { pkgSlug: 'standard', itemSlug: 'staircase_flooring', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: "2'x2' @ ₹50/sqft"  },
    { pkgSlug: 'premium',  itemSlug: 'staircase_flooring', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'Granite @ ₹120/sqft' },
    { pkgSlug: 'luxury',   itemSlug: 'staircase_flooring', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'Granite @ ₹160/sqft' },
    // ── Flooring: Parking ────────────────────────────────────────────────────
    { pkgSlug: 'basic',    itemSlug: 'parking_flooring', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'Tiles @ ₹45/sqft'  },
    { pkgSlug: 'standard', itemSlug: 'parking_flooring', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'Tiles @ ₹50/sqft'  },
    { pkgSlug: 'premium',  itemSlug: 'parking_flooring', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'Tiles @ ₹70/sqft'  },
    { pkgSlug: 'luxury',   itemSlug: 'parking_flooring', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'Tiles @ ₹100/sqft' },
    // ── Main Door ────────────────────────────────────────────────────────────
    { pkgSlug: 'basic',    itemSlug: 'main_door', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'Readymade Teak 5"x3", 3.5\'x7\''  },
    { pkgSlug: 'standard', itemSlug: 'main_door', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'Readymade Teak 5"x4", 3.5\'x7\''  },
    { pkgSlug: 'premium',  itemSlug: 'main_door', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: '1st Quality Teak 5"x4", 3.5\'x7\'' },
    { pkgSlug: 'luxury',   itemSlug: 'main_door', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: '1st Quality Burma Teak 5"x4", 3.5\'x8\'' },
    // ── Internal Doors ───────────────────────────────────────────────────────
    { pkgSlug: 'basic',    itemSlug: 'internal_doors', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'Flush 4"x2.5" frame'         },
    { pkgSlug: 'standard', itemSlug: 'internal_doors', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'Laminated Flush 4"x3" frame'  },
    { pkgSlug: 'premium',  itemSlug: 'internal_doors', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'Teak Door 4"x3" frame'        },
    { pkgSlug: 'luxury',   itemSlug: 'internal_doors', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'Burma Teak Door 4"x3" frame'  },
    // ── Windows ──────────────────────────────────────────────────────────────
    { pkgSlug: 'basic',    itemSlug: 'windows', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'UPVC Sliding (White)' },
    { pkgSlug: 'standard', itemSlug: 'windows', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'UPVC Sliding (White)' },
    { pkgSlug: 'premium',  itemSlug: 'windows', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'UPVC Sliding & Open'  },
    { pkgSlug: 'luxury',   itemSlug: 'windows', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'UPVC Sliding & Open + Net Mesh' },
    // ── Interior Painting ────────────────────────────────────────────────────
    { pkgSlug: 'basic',    itemSlug: 'interior_painting', defaultOptionSlug: 'isi_emulsion',  isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: 'standard', itemSlug: 'interior_painting', defaultOptionSlug: 'asian_tractor', isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: 'premium',  itemSlug: 'interior_painting', defaultOptionSlug: 'asian_premium', isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: 'luxury',   itemSlug: 'interior_painting', defaultOptionSlug: 'asian_royale',  isIncluded: true, additionalCostPrice: '0.00' },
    // ── Exterior Painting ────────────────────────────────────────────────────
    { pkgSlug: 'basic',    itemSlug: 'exterior_painting', defaultOptionSlug: 'isi_exterior',  isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: 'standard', itemSlug: 'exterior_painting', defaultOptionSlug: 'asian_ace',     isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: 'premium',  itemSlug: 'exterior_painting', defaultOptionSlug: 'asian_apex',    isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: 'luxury',   itemSlug: 'exterior_painting', defaultOptionSlug: 'ultima_protek', isIncluded: true, additionalCostPrice: '0.00' },
    // ── Wires & Switches ─────────────────────────────────────────────────────
    { pkgSlug: 'basic',    itemSlug: 'wires_switches', defaultOptionSlug: 'isi_switches',    isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: 'standard', itemSlug: 'wires_switches', defaultOptionSlug: 'rr_anchor_roma',  isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: 'premium',  itemSlug: 'wires_switches', defaultOptionSlug: 'finolex_legrand', isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: 'luxury',   itemSlug: 'wires_switches', defaultOptionSlug: 'finolex_legrand', isIncluded: true, additionalCostPrice: '0.00' },
    // ── Lights ───────────────────────────────────────────────────────────────
    { pkgSlug: 'basic',    itemSlug: 'lights', defaultOptionSlug: 'any_isi_lights',  isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: 'standard', itemSlug: 'lights', defaultOptionSlug: 'luker_lights',    isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: 'premium',  itemSlug: 'lights', defaultOptionSlug: 'philips_lights',  isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: 'luxury',   itemSlug: 'lights', defaultOptionSlug: 'philips_lights',  isIncluded: true, additionalCostPrice: '0.00' },
    // ── Ceiling Fans — Basic/Standard: +₹50/sqft; Premium/Luxury: Crompton included ──
    { pkgSlug: 'basic',    itemSlug: 'ceiling_fans', isIncluded: false, additionalCostPrice: '50.00' },
    { pkgSlug: 'standard', itemSlug: 'ceiling_fans', isIncluded: false, additionalCostPrice: '50.00' },
    { pkgSlug: 'premium',  itemSlug: 'ceiling_fans', isIncluded: true,  additionalCostPrice: '0.00', includedCoverage: 'Crompton (Included)' },
    { pkgSlug: 'luxury',   itemSlug: 'ceiling_fans', isIncluded: true,  additionalCostPrice: '0.00', includedCoverage: 'Crompton (Included)' },
    // ── Overhead Tank ────────────────────────────────────────────────────────
    { pkgSlug: 'basic',    itemSlug: 'overhead_tank', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: '500L + 500L ISI'              },
    { pkgSlug: 'standard', itemSlug: 'overhead_tank', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: '500L + 500L Kavery'            },
    { pkgSlug: 'premium',  itemSlug: 'overhead_tank', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: '1000L + 1000L Ideal/Sintex'    },
    { pkgSlug: 'luxury',   itemSlug: 'overhead_tank', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: '3000L Readymade Tanks'          },
    // ── Railings ─────────────────────────────────────────────────────────────
    { pkgSlug: 'basic',    itemSlug: 'railings', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'MS Railings'                         },
    { pkgSlug: 'standard', itemSlug: 'railings', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'MS Railings'                         },
    { pkgSlug: 'premium',  itemSlug: 'railings', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'SS 304 Grade Railings'               },
    { pkgSlug: 'luxury',   itemSlug: 'railings', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: 'Toughened Glass w/ SS/Wood/Alu'      },
    // ── Parapet Wall ─────────────────────────────────────────────────────────
    { pkgSlug: 'basic',    itemSlug: 'parapet_wall', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: '3 ft — 4.5" thick'  },
    { pkgSlug: 'standard', itemSlug: 'parapet_wall', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: '3 ft — 4.5" thick'  },
    { pkgSlug: 'premium',  itemSlug: 'parapet_wall', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: '3 ft — 9" thick'    },
    { pkgSlug: 'luxury',   itemSlug: 'parapet_wall', isIncluded: true, additionalCostPrice: '0.00', includedCoverage: '3.5 ft — 9" thick'  },
    // ── Roof Weathering ──────────────────────────────────────────────────────
    // Basic: free >2000sqft, else +₹80/sqft; Standard: free >2000sqft, else +₹70/sqft; Premium/Luxury: included
    { pkgSlug: 'basic',    itemSlug: 'roof_weathering', isIncluded: false, additionalCostPrice: '80.00', includedCoverage: 'Free if area > 2000 sqft'   },
    { pkgSlug: 'standard', itemSlug: 'roof_weathering', isIncluded: false, additionalCostPrice: '70.00', includedCoverage: 'Free if area > 2000 sqft'   },
    { pkgSlug: 'premium',  itemSlug: 'roof_weathering', isIncluded: true,  additionalCostPrice: '0.00'  },
    { pkgSlug: 'luxury',   itemSlug: 'roof_weathering', isIncluded: true,  additionalCostPrice: '0.00'  },
    // ── Lofts & Shelves — Basic/Standard: +₹12; Premium/Luxury: 1 loft/room included ──
    { pkgSlug: 'basic',    itemSlug: 'lofts_shelves', isIncluded: false, additionalCostPrice: '12.00' },
    { pkgSlug: 'standard', itemSlug: 'lofts_shelves', isIncluded: false, additionalCostPrice: '12.00' },
    { pkgSlug: 'premium',  itemSlug: 'lofts_shelves', isIncluded: true,  additionalCostPrice: '0.00', includedCoverage: '1 loft per room (Max 5 ft)' },
    { pkgSlug: 'luxury',   itemSlug: 'lofts_shelves', isIncluded: true,  additionalCostPrice: '0.00', includedCoverage: '1 loft per room (Max 5 ft)' },
    // ── False Ceiling — Basic/Standard: +₹12; Premium/Luxury: included ──────
    { pkgSlug: 'basic',    itemSlug: 'false_ceiling', isIncluded: false, additionalCostPrice: '12.00' },
    { pkgSlug: 'standard', itemSlug: 'false_ceiling', isIncluded: false, additionalCostPrice: '12.00' },
    { pkgSlug: 'premium',  itemSlug: 'false_ceiling', isIncluded: true,  additionalCostPrice: '0.00'  },
    { pkgSlug: 'luxury',   itemSlug: 'false_ceiling', isIncluded: true,  additionalCostPrice: '0.00'  },
    // ── Anti-Termite & Earthing — all included ────────────────────────────────
    { pkgSlug: 'basic',    itemSlug: 'anti_termite', isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: 'standard', itemSlug: 'anti_termite', isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: 'premium',  itemSlug: 'anti_termite', isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: 'luxury',   itemSlug: 'anti_termite', isIncluded: true, additionalCostPrice: '0.00' },
  ];

  const piInserts = piDefs.map((d) => ({
    packageId:            pkgIds[d.pkgSlug],
    itemId:               itemIdBySlug[d.itemSlug],
    defaultOptionId:      d.defaultOptionSlug ? optIdBySlug[d.defaultOptionSlug] : null,
    includedCoverage:     d.includedCoverage ?? null,
    isIncluded:           d.isIncluded,
    additionalCostPrice:  d.additionalCostPrice,
  }));

  const existingPackageItems = await db
    .select({ packageId: packageItems.packageId, itemId: packageItems.itemId })
    .from(packageItems);
  const existingPiKeys = new Set(existingPackageItems.map(pi => `${pi.packageId}:${pi.itemId}`));
  const piToInsert = piInserts.filter(pi => !existingPiKeys.has(`${pi.packageId}:${pi.itemId}`));
  let piCount = 0;
  if (piToInsert.length > 0) {
    const inserted = await db.insert(packageItems).values(piToInsert).returning();
    piCount = inserted.length;
  }
  log('Package Items (package × item mappings)', piCount);

  // -------------------------------------------------------------------------
  // OPTION_PRICES — upgrade deltas for brand options
  // Source: requirements §5 (masonry red brick upgrade, rcc basement upgrade)
  // -------------------------------------------------------------------------
  const opDefs: {
    optionSlug: string;
    packageSlug?: string;
    priceDelta: string;
    priceType: string;
  }[] = [
    // Masonry: Red brick upgrade from Solid block (Basic) → +₹120/sqft
    { optionSlug: 'red_brick', packageSlug: 'basic',    priceDelta: '120.00', priceType: 'per_sqft' },
    // Masonry: Red brick upgrade from Fly ash (Standard/Premium) → +₹100/sqft
    { optionSlug: 'red_brick', packageSlug: 'standard', priceDelta: '100.00', priceType: 'per_sqft' },
    { optionSlug: 'red_brick', packageSlug: 'premium',  priceDelta: '100.00', priceType: 'per_sqft' },
    // RCC Basement upgrade from PCC (Basic/Standard/Premium) → +₹40/sqft
    { optionSlug: 'rcc_basement', packageSlug: 'basic',    priceDelta: '40.00', priceType: 'per_sqft' },
    { optionSlug: 'rcc_basement', packageSlug: 'standard', priceDelta: '40.00', priceType: 'per_sqft' },
    { optionSlug: 'rcc_basement', packageSlug: 'premium',  priceDelta: '40.00', priceType: 'per_sqft' },

    // -----------------------------------------------------------------------
    // Brand upgrade deltas — migration 0012.
    // Rule (confirmed by Sundar 2026-09-01): delta = cost at the option's tier
    // minus cost at the customer's tier, clamped at zero. Tier costs come from
    // tab 1821959866 of the rate card. See 0012_brand_upgrade_deltas.sql for the
    // cross-check and for what is deliberately left out (painting, masonry).
    // -----------------------------------------------------------------------
    // Steel Rebar Fe 550D — 305 / 320 / 350 / 400
    { optionSlug: 'spa_vizag_steel',    packageSlug: 'basic',    priceDelta: '15.00', priceType: 'per_sqft' },
    { optionSlug: 'ars_suryadev_steel', packageSlug: 'basic',    priceDelta: '45.00', priceType: 'per_sqft' },
    { optionSlug: 'ars_suryadev_steel', packageSlug: 'standard', priceDelta: '30.00', priceType: 'per_sqft' },
    { optionSlug: 'jsw_tata_steel',     packageSlug: 'basic',    priceDelta: '95.00', priceType: 'per_sqft' },
    { optionSlug: 'jsw_tata_steel',     packageSlug: 'standard', priceDelta: '80.00', priceType: 'per_sqft' },
    { optionSlug: 'jsw_tata_steel',     packageSlug: 'premium',  priceDelta: '50.00', priceType: 'per_sqft' },
    // Cement — 210 / 215 / 225 / 245
    { optionSlug: 'jsw_cement',          packageSlug: 'basic',    priceDelta: '5.00',  priceType: 'per_sqft' },
    { optionSlug: 'ramco_dalmia_cement', packageSlug: 'basic',    priceDelta: '15.00', priceType: 'per_sqft' },
    { optionSlug: 'ramco_dalmia_cement', packageSlug: 'standard', priceDelta: '10.00', priceType: 'per_sqft' },
    { optionSlug: 'ultratech_chettinad', packageSlug: 'basic',    priceDelta: '35.00', priceType: 'per_sqft' },
    { optionSlug: 'ultratech_chettinad', packageSlug: 'standard', priceDelta: '30.00', priceType: 'per_sqft' },
    { optionSlug: 'ultratech_chettinad', packageSlug: 'premium',  priceDelta: '20.00', priceType: 'per_sqft' },
    // PVC & CPVC Pipes — 100 / 125 / 145 / 160
    { optionSlug: 'watertec',        packageSlug: 'basic',    priceDelta: '25.00', priceType: 'per_sqft' },
    { optionSlug: 'kavery_ashirwad', packageSlug: 'basic',    priceDelta: '45.00', priceType: 'per_sqft' },
    { optionSlug: 'kavery_ashirwad', packageSlug: 'standard', priceDelta: '20.00', priceType: 'per_sqft' },
    { optionSlug: 'finolex_supreme', packageSlug: 'basic',    priceDelta: '60.00', priceType: 'per_sqft' },
    { optionSlug: 'finolex_supreme', packageSlug: 'standard', priceDelta: '35.00', priceType: 'per_sqft' },
    { optionSlug: 'finolex_supreme', packageSlug: 'premium',  priceDelta: '15.00', priceType: 'per_sqft' },
    // Sanitary & CP Fittings — 40 / 60 / 90 / 135
    { optionSlug: 'parryware',   packageSlug: 'basic',    priceDelta: '20.00', priceType: 'per_sqft' },
    { optionSlug: 'jaquar',      packageSlug: 'basic',    priceDelta: '50.00', priceType: 'per_sqft' },
    { optionSlug: 'jaquar',      packageSlug: 'standard', priceDelta: '30.00', priceType: 'per_sqft' },
    { optionSlug: 'toto_kohler', packageSlug: 'basic',    priceDelta: '95.00', priceType: 'per_sqft' },
    { optionSlug: 'toto_kohler', packageSlug: 'standard', priceDelta: '75.00', priceType: 'per_sqft' },
    { optionSlug: 'toto_kohler', packageSlug: 'premium',  priceDelta: '45.00', priceType: 'per_sqft' },
    // Wires & Switches — wires 60/75/90/90 + switches 17/22/28/28 = 77 / 97 / 118 / 118
    { optionSlug: 'rr_anchor_roma',  packageSlug: 'basic',    priceDelta: '20.00', priceType: 'per_sqft' },
    { optionSlug: 'finolex_legrand', packageSlug: 'basic',    priceDelta: '41.00', priceType: 'per_sqft' },
    { optionSlug: 'finolex_legrand', packageSlug: 'standard', priceDelta: '21.00', priceType: 'per_sqft' },
    // Lights — 17 / 22 / 28 / 28
    { optionSlug: 'luker_lights',   packageSlug: 'basic',    priceDelta: '5.00',  priceType: 'per_sqft' },
    { optionSlug: 'philips_lights', packageSlug: 'basic',    priceDelta: '11.00', priceType: 'per_sqft' },
    { optionSlug: 'philips_lights', packageSlug: 'standard', priceDelta: '6.00',  priceType: 'per_sqft' },
    // Waterproofing — 0 / 10 / 10 / 10; all three brands are equivalent, so Basic
    // pays ₹10 for any of them. Stated per option so the UI shows it.
    { optionSlug: 'dr_fixit', packageSlug: 'basic', priceDelta: '10.00', priceType: 'per_sqft' },
    { optionSlug: 'fosroc',   packageSlug: 'basic', priceDelta: '10.00', priceType: 'per_sqft' },
    { optionSlug: 'bostik',   packageSlug: 'basic', priceDelta: '10.00', priceType: 'per_sqft' },
  ];

  const opInserts = opDefs.map((d) => ({
    optionId:    optIdBySlug[d.optionSlug],
    packageId:   d.packageSlug ? pkgIds[d.packageSlug] : null,
    priceDelta:  d.priceDelta,
    priceType:   d.priceType,
  }));

  const existingActiveOptions = await db
    .select({ optionId: optionPrices.optionId, packageId: optionPrices.packageId })
    .from(optionPrices)
    .where(isNull(optionPrices.effectiveTo));
  const activeOptionKeys = new Set(existingActiveOptions.map(r => `${r.optionId}:${r.packageId ?? 'null'}`));

  const opToInsert = opInserts.filter(p => !activeOptionKeys.has(`${p.optionId}:${p.packageId ?? 'null'}`));
  let opInsertedCount = 0;
  if (opToInsert.length > 0) {
    const inserted = await db.insert(optionPrices).values(opToInsert).returning();
    opInsertedCount = inserted.length;
  }
  log('Option Prices (upgrade deltas)', opInsertedCount);
}

// ---------------------------------------------------------------------------
// 5. ADD-ONS + ADD-ON PRICES
// ---------------------------------------------------------------------------

async function seedAddons() {
  // 15 add-ons — source: requirements §6
  const addonDefs = [
    {
      slug: 'overhead_concrete_tank', name: 'Overhead Concrete Tank',
      description: 'Custom capacity overhead water storage tank. Capacity selected in Litres. A family of 4 opt for 2,500 Litres.',
      pricingUnit: 'per_litre', defaultQuantity: '2500', minQuantity: '500', maxQuantity: '20000', sortOrder: 1,
    },
    {
      slug: 'conventional_septic_tank', name: 'Conventional Septic Tank',
      description: 'Volume-based septic tank. Capacity selected in Litres. A family of 4 opt for 5,000 Litres.',
      pricingUnit: 'per_litre', defaultQuantity: '5000', minQuantity: '1000', maxQuantity: '20000', sortOrder: 2,
    },
    {
      slug: 'underground_sump', name: 'Underground Sump',
      description: 'Underground water sump. Capacity selected in Litres. A family of 4 opt for 6,000 Litres.',
      pricingUnit: 'per_litre', defaultQuantity: '6000', minQuantity: '1000', maxQuantity: '30000', sortOrder: 3,
    },
    {
      slug: 'compound_wall', name: 'Compound Wall (upto 5\'6" Height)',
      description: 'Perimeter compound wall up to 5\'6" height. Running feet entered by customer.',
      pricingUnit: 'per_rft', defaultQuantity: '50', minQuantity: '10', maxQuantity: '500', sortOrder: 4,
    },
    {
      slug: 'rooftop_solar', name: 'Rooftop Solar Panels',
      description: 'Grid-tied rooftop solar system. Pricing before subsidy reduction (subsidy approx. ₹78,000). 3 kW per day required for a 1 to 3 BHK home.',
      pricingUnit: 'fixed', sortOrder: 5,
    },
    {
      // The rate card leaves the 2-car gate area blank, so it is not stated (Rule #3).
      slug: 'main_gate', name: 'Main Gate',
      description: 'Main entrance gate. Price per sq.ft of gate area. Guide: 1 car gate 10\' x 6\' = 60 sq.ft; wicket gate 3.5\' x 6\' = 21 sq.ft.',
      pricingUnit: 'per_sqft_gate', defaultQuantity: '60', minQuantity: '20', maxQuantity: '200', sortOrder: 6,
    },
    {
      slug: 'cctv_security', name: 'CCTV & Security System',
      description: 'Complete CCTV setup with DVR and storage.',
      pricingUnit: 'fixed', sortOrder: 7,
    },
    {
      slug: 'smart_home', name: 'Smart Home Automation',
      description: 'Smart switches, lights, fans and main door lock with mobile app control.',
      pricingUnit: 'fixed', sortOrder: 8,
    },
    {
      slug: 'passenger_lift', name: 'Passenger Lift (4 Pax)',
      description: 'Complete 4-passenger lift installation.',
      pricingUnit: 'fixed', sortOrder: 9,
    },
    {
      slug: 'choke_pit', name: 'Choke Pit & Rings',
      description: 'Choke pits and rings. Two pits keep toilet and other water separate.',
      pricingUnit: 'fixed', sortOrder: 10,
    },
    {
      // Renamed on the rate card; the SLUG stays so existing estimate rows resolve.
      slug: 'solar_water_heater', name: 'Water Heat Pump',
      description: 'Solar or electric water heating. 200 to 250 Litres per day required for a family of 5.',
      pricingUnit: 'fixed', sortOrder: 11,
    },
    {
      slug: 'cool_roof_tiles', name: 'Cool Roof Tiles',
      description: "1'x1' white cool tiles with epoxy waterproofing. Price per sq.ft of terrace.",
      pricingUnit: 'per_sqft_terrace', defaultQuantity: '100', minQuantity: '50', maxQuantity: '2000', sortOrder: 12,
    },
    {
      // Fitted per tank, so bore-water and corporation-water may both be selected.
      slug: 'motor_automation', name: 'Motor Automation (Auto Cut-Off)',
      description: 'Automatic water controller with auto cut-off.',
      pricingUnit: 'fixed', sortOrder: 13, allowsMultiple: true,
    },
    {
      slug: 'pressure_pump', name: 'Pressure Pump',
      description: 'High-pressure plumbing pump. Brand: Grundfos.',
      pricingUnit: 'fixed', sortOrder: 14,
    },
    {
      // Not on the 2026-09 rate card — kept active and unpriced pending confirmation.
      slug: 'waste_water_recycling', name: 'Waste Water Recycling Tank',
      description: 'Greywater treatment and garden recycling system.',
      pricingUnit: 'fixed', sortOrder: 15,
    },
    {
      slug: 'water_softener', name: 'Water Softener',
      description: 'Whole-house water softener. Brand: AO Smith. Suitable for TDS below 1000.',
      pricingUnit: 'fixed', sortOrder: 16,
    },
  ];

  const existingAddons = await db.select({ slug: addons.slug }).from(addons);
  const existingAddonSlugs = new Set(existingAddons.map(a => a.slug));
  const addonsToInsert = addonDefs.filter(a => !existingAddonSlugs.has(a.slug));
  let addonCount = 0;
  if (addonsToInsert.length > 0) {
    const inserted = await db.insert(addons).values(addonsToInsert).returning();
    addonCount = inserted.length;
  }
  log('Add-Ons', addonCount);

  // Fetch addon IDs
  const addonRows = await db.select().from(addons);
  const addonIdBySlug: Record<string, number> = {};
  for (const r of addonRows) addonIdBySlug[r.slug] = r.id;

  // Add-on prices — source: requirements §6
  const addonPriceDefs = [
    // 1. Overhead Concrete Tank: ₹35/L (Basic/Standard), ₹45/L (Premium/Luxury)
    { addonSlug: 'overhead_concrete_tank', variantName: 'Basic/Standard Rate',   variantSlug: 'basic_std',    packageTier: 'basic_standard',   price: '35.00' },
    { addonSlug: 'overhead_concrete_tank', variantName: 'Premium/Luxury Rate',   variantSlug: 'prem_lux',     packageTier: 'premium_luxury',   price: '45.00' },
    // 2. Conventional Septic Tank: ₹26/L (Fly ash), ₹30/L (brick+concrete), ₹33/L (9" concrete)
    { addonSlug: 'conventional_septic_tank', variantName: 'Fly Ash Brick',                  variantSlug: 'flyash',         packageTier: 'all', price: '26.00' },
    { addonSlug: 'conventional_septic_tank', variantName: '4.5" Brick + 4.5" Concrete',     variantSlug: 'brick_concrete', packageTier: 'all', price: '30.00' },
    { addonSlug: 'conventional_septic_tank', variantName: '9" Concrete',                    variantSlug: '9in_concrete',   packageTier: 'all', price: '33.00' },
    // 3. Underground Sump: same 3 tiers as septic
    { addonSlug: 'underground_sump', variantName: 'Fly Ash Brick',              variantSlug: 'flyash',         packageTier: 'all', price: '26.00' },
    { addonSlug: 'underground_sump', variantName: '4.5" Brick + 4.5" Concrete', variantSlug: 'brick_concrete', packageTier: 'all', price: '30.00' },
    { addonSlug: 'underground_sump', variantName: '9" Concrete',                variantSlug: '9in_concrete',   packageTier: 'all', price: '33.00' },
    // 4. Compound Wall: ₹2,300/rft (solid/fly ash), ₹2,900/rft (red brick)
    { addonSlug: 'compound_wall', variantName: 'Solid Block / Fly Ash', variantSlug: 'solid_flyash', packageTier: 'all', price: '2300.00' },
    { addonSlug: 'compound_wall', variantName: 'Red Brick',             variantSlug: 'red_brick',    packageTier: 'all', price: '2900.00' },
    // 5. Rooftop Solar (before subsidy): ₹1,85,000 (3kW), ₹2,95,000 (5kW)
    { addonSlug: 'rooftop_solar', variantName: '3 kW System', variantSlug: '3kw', packageTier: 'all', price: '185000.00' },
    { addonSlug: 'rooftop_solar', variantName: '5 kW System', variantSlug: '5kw', packageTier: 'all', price: '295000.00' },
    // 6. Main Gate: ₹620 (MS), ₹1,250 (SS), ₹1,300 (MS + automation), ₹2,000 (SS + automation) per sqft of gate
    { addonSlug: 'main_gate', variantName: 'MS Gate',                              variantSlug: 'ms_gate',      packageTier: 'all', price: '620.00' },
    { addonSlug: 'main_gate', variantName: 'Stainless Steel Gate',                 variantSlug: 'ss_gate',      packageTier: 'all', price: '1250.00' },
    { addonSlug: 'main_gate', variantName: 'MS Gate with Automation',              variantSlug: 'ms_gate_auto', packageTier: 'all', price: '1300.00' },
    { addonSlug: 'main_gate', variantName: 'Stainless Steel Gate with Automation', variantSlug: 'ss_gate_auto', packageTier: 'all', price: '2000.00' },
    // 7. CCTV: ₹37,000 (4×2MP), ₹45,000 (4×5MP)
    { addonSlug: 'cctv_security', variantName: '4 Camera 2MP Color AHD', variantSlug: '4cam_2mp', packageTier: 'all', price: '37000.00' },
    { addonSlug: 'cctv_security', variantName: '4 Camera 5MP Color AHD', variantSlug: '4cam_5mp', packageTier: 'all', price: '45000.00' },
    // 8. Smart Home: ₹2,80,000
    { addonSlug: 'smart_home', variantName: 'Switches, Lights, Fans & Main Door Lock', variantSlug: 'standard', packageTier: 'all', price: '280000.00' },
    // 9. Passenger Lift: ₹12,50,000
    { addonSlug: 'passenger_lift', variantName: '4-Passenger Lift', variantSlug: '4pax', packageTier: 'all', price: '1250000.00' },
    // 10. Choke Pit: the rate card lists BOTH the 1-pit and 2-pit option at ₹15,000.
    //     Transcribed as written — flagged for Sundar rather than corrected (Rule #3).
    { addonSlug: 'choke_pit', variantName: '1 Choke Pit',                                  variantSlug: '1pit',  packageTier: 'all', price: '15000.00' },
    { addonSlug: 'choke_pit', variantName: '2 Choke Pits (toilet & other water separate)', variantSlug: '2pits', packageTier: 'all', price: '15000.00' },
    // 11. Water Heat Pump: ₹50,000 (solar 125L), ₹1,00,000 (solar 250L), ₹1,76,000 (electric)
    { addonSlug: 'solar_water_heater', variantName: 'Solar — 125 L Capacity',                  variantSlug: '125l',        packageTier: 'all', price: '50000.00' },
    { addonSlug: 'solar_water_heater', variantName: 'Solar — 250 L Capacity',                  variantSlug: '250l',        packageTier: 'all', price: '100000.00' },
    { addonSlug: 'solar_water_heater', variantName: 'Electric AO Smith HPI 40 — 24 hr Supply', variantSlug: 'electric_hp', packageTier: 'all', price: '176000.00' },
    // 12. Cool Roof Tiles: ₹170/sqft
    { addonSlug: 'cool_roof_tiles', variantName: '1\'x1\' White with Epoxy', variantSlug: 'white_epoxy', packageTier: 'all', price: '170.00' },
    // 13. Motor Automation: ₹12,000 (bore), ₹12,000 (corporation)
    { addonSlug: 'motor_automation', variantName: 'Bore Water OHT',        variantSlug: 'bore',        packageTier: 'all', price: '12000.00' },
    { addonSlug: 'motor_automation', variantName: 'Corporation Water OHT', variantSlug: 'corporation', packageTier: 'all', price: '12000.00' },
    // 14. Pressure Pump (Grundfos): ₹57,500 / ₹71,000 / ₹82,800 / ₹1,07,000
    { addonSlug: 'pressure_pump', variantName: '3 Bathrooms, No Body Shower',              variantSlug: 'g_3bath',        packageTier: 'all', price: '57500.00' },
    { addonSlug: 'pressure_pump', variantName: '4+ Bathrooms, No Body Shower',             variantSlug: 'g_4bath',        packageTier: 'all', price: '71000.00' },
    { addonSlug: 'pressure_pump', variantName: '1 Bathroom with Body Shower + 2 Without',  variantSlug: 'g_1bath_shower', packageTier: 'all', price: '82800.00' },
    { addonSlug: 'pressure_pump', variantName: '3 Bathrooms with Body Shower',             variantSlug: 'g_3bath_shower', packageTier: 'all', price: '107000.00' },
    // 15. Waste Water Recycling: TBD — zero placeholder (rule 3: never invent prices)
    { addonSlug: 'waste_water_recycling', variantName: 'Standard Tank', variantSlug: 'standard', packageTier: 'all', price: '0.00' },
    // 16. Water Softener (AO Smith): ₹1,05,000
    { addonSlug: 'water_softener', variantName: 'Suitable for TDS below 1000', variantSlug: 'tds_below_1000', packageTier: 'all', price: '105000.00' },
  ];

  const apInserts = addonPriceDefs.map((d) => ({
    addonId:     addonIdBySlug[d.addonSlug],
    variantName: d.variantName,
    variantSlug: d.variantSlug,
    packageTier: d.packageTier,
    price:       d.price,
  }));

  const existingActiveAddons = await db
    .select({ addonId: addonPrices.addonId, variantSlug: addonPrices.variantSlug })
    .from(addonPrices)
    .where(isNull(addonPrices.effectiveTo));
  const activeAddonKeys = new Set(existingActiveAddons.map(r => `${r.addonId}:${r.variantSlug}`));

  const apToInsert = apInserts.filter(p => !activeAddonKeys.has(`${p.addonId}:${p.variantSlug}`));
  let apInsertedCount = 0;
  if (apToInsert.length > 0) {
    const inserted = await db.insert(addonPrices).values(apToInsert).returning();
    apInsertedCount = inserted.length;
  }
  log('Add-On Prices', apInsertedCount);
}

// ---------------------------------------------------------------------------
// 6. DEFAULT ADMIN USER
// ---------------------------------------------------------------------------

async function seedAdminUser() {
  // Check if any admin already exists — skip if so
  const existing = await db.select().from(adminUsers).limit(1);
  if (existing.length > 0) {
    console.log('  ⏭️  Admin user: already exists, skipped.');
    return;
  }

  const email = process.env.ADMIN_SEED_EMAIL ?? 'admin@asthiwar.com';
  const plainPassword = process.env.ADMIN_SEED_PASSWORD ?? 'ChangeMe@2026!';

  const passwordHash = await bcrypt.hash(plainPassword, 12);

  await db.insert(adminUsers).values({
    email,
    passwordHash,
    fullName: 'Asthiwar Admin',
    role: 'super_admin',
    isActive: true,
  });

  console.log(`  ✅ Admin user: seeded (${email})`);
  if (!process.env.ADMIN_SEED_PASSWORD) {
    console.log('  ⚠️  Default password used. Set ADMIN_SEED_PASSWORD in .env before production.');
  }
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------

async function main() {
  console.log('\n🌱 ASTHIWAR Master Data Seed — Phase 3\n');
  console.log('----------------------------------------');

  try {
    console.log('\n📍 Seeding Locations...');
    await seedLocations();

    console.log('\n📦 Seeding Packages & Prices...');
    const pkgIds = await seedPackages();

    console.log('\n🗂️  Seeding Categories...');
    const catIds = await seedCategories();

    console.log('\n🔩 Seeding Specifications (Items → Options → Package Mappings → Prices)...');
    await seedSpecifications(pkgIds, catIds);

    console.log('\n🔌 Seeding Add-Ons & Prices...');
    await seedAddons();

    console.log('\n🔐 Seeding Admin User...');
    await seedAdminUser();

    console.log('\n----------------------------------------');
    console.log('✅ Phase 3 Complete — All master data seeded on Neon PostgreSQL.\n');
  } catch (err) {
    console.error('\n❌ Seed failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();

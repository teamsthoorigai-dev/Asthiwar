/**
 * ASTHIWAR — Master Data Seed Script (Phase 3 - Updated for v4/v5 Packages)
 *
 * Seeds 100% of the approved business data from:
 *   - temp/Construction Packages_v4/
 *   - temp/asthiwar_requirements_and_packages.md
 *
 * Run via: npm run db:seed (from database/ directory)
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
  milestoneStages,
} from '../schema/index';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';

function log(section: string, count: number) {
  console.log(`  ✅ ${section}: ${count} row(s) inserted`);
}

// ---------------------------------------------------------------------------
// 1. LOCATIONS
// ---------------------------------------------------------------------------

async function seedLocations() {
  const data = [
    { name: 'Coimbatore', slug: 'coimbatore', priceMultiplier: '1.0000', sortOrder: 1 },
    { name: 'Pollachi',   slug: 'pollachi',   priceMultiplier: '0.9600', sortOrder: 2 },
    { name: 'Tiruppur',   slug: 'tiruppur',   priceMultiplier: '0.9800', sortOrder: 3 },
    { name: 'Erode',      slug: 'erode',      priceMultiplier: '0.9800', sortOrder: 4 },
    { name: 'Chennai',    slug: 'chennai',    priceMultiplier: '1.0500', sortOrder: 5 },
    { name: 'Madurai',    slug: 'madurai',    priceMultiplier: '1.0000', sortOrder: 6 },
    { name: 'Virudhunagar',slug: 'virudhunagar', priceMultiplier: '1.0000', sortOrder: 7 },
    { name: 'Other TN',   slug: 'other_tn',   priceMultiplier: '0.9600', sortOrder: 8 },
  ];

  await db.insert(locations).values(data).onConflictDoNothing();
  log('Locations', data.length);
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
      description: 'Economical / Starter Home — ISI-brand materials throughout.',
      colorTheme: '#6B7280',
      sortOrder: 1,
    },
    {
      slug: 'standard',
      name: 'Standard Package',
      tagline: 'Budget Friendly',
      description: 'Mid-range family home — upgraded steel, cement and finishing brands.',
      colorTheme: '#3B82F6',
      sortOrder: 2,
    },
    {
      slug: 'premium',
      name: 'Premium Package',
      tagline: 'Best Value',
      description: 'High-spec modern residence — Jaquar fittings, Ultratech cement, SS railings.',
      colorTheme: '#8B5CF6',
      sortOrder: 3,
    },
    {
      slug: 'luxury',
      name: 'Luxury Package',
      tagline: 'Top Tier',
      description: 'Premium architectural villa — Burma Teak, Toto/Kohler, Toughened Glass.',
      colorTheme: '#F59E0B',
      sortOrder: 4,
    },
  ];

  await db.insert(packages).values(pkgs).onConflictDoNothing();
  log('Packages', pkgs.length);

  // Fetch inserted IDs by slug
  const pkgRows = await db.select().from(packages);
  const idBySlug: Record<string, number> = {};
  for (const p of pkgRows) idBySlug[p.slug] = p.id;

  // Package prices — source: Construction Packages_v4 Residencial Pricing
  const prices = [
    // Basic: ₹2,099 / ₹1,999 (>3500 sqft)
    {
      packageId: idBySlug['basic'],
      pricePerSqft: '2099.00',
      volumeDiscountThresholdSqft: 3500,
      volumePricePerSqft: '1999.00',
    },
    // Standard: ₹2,468 / ₹2,357 (>3500 sqft)
    {
      packageId: idBySlug['standard'],
      pricePerSqft: '2468.00',
      volumeDiscountThresholdSqft: 3500,
      volumePricePerSqft: '2357.00',
    },
    // Premium: ₹2,899 / ₹2,799 (>3500 sqft)
    {
      packageId: idBySlug['premium'],
      pricePerSqft: '2899.00',
      volumeDiscountThresholdSqft: 3500,
      volumePricePerSqft: '2799.00',
    },
    // Luxury: ₹3,250 / ₹3,200 (>3500 sqft)
    {
      packageId: idBySlug['luxury'],
      pricePerSqft: '3250.00',
      volumeDiscountThresholdSqft: 3500,
      volumePricePerSqft: '3200.00',
    },
  ];

  for (const p of prices) {
    await db.insert(packagePrices).values(p).onConflictDoUpdate({
      target: packagePrices.packageId,
      set: {
        pricePerSqft: p.pricePerSqft,
        volumeDiscountThresholdSqft: p.volumeDiscountThresholdSqft,
        volumePricePerSqft: p.volumePricePerSqft,
      },
    });
  }
  log('Package Prices', prices.length);

  return idBySlug;
}

// ---------------------------------------------------------------------------
// 3. CATEGORIES
// ---------------------------------------------------------------------------

async function seedCategories() {
  const cats = [
    { slug: 'structure',      name: 'Structure & Civil',           sortOrder: 1 },
    { slug: 'design',         name: 'Design & Engineering',        sortOrder: 2 },
    { slug: 'kitchen',        name: 'Kitchen & Plumbing',          sortOrder: 3 },
    { slug: 'bathroom',       name: 'Bathroom & Sanitary',         sortOrder: 4 },
    { slug: 'flooring',       name: 'Flooring',                    sortOrder: 5 },
    { slug: 'doors_windows',  name: 'Doors & Windows',             sortOrder: 6 },
    { slug: 'painting',       name: 'Painting',                    sortOrder: 7 },
    { slug: 'electrical',     name: 'Electrical & Utilities',      sortOrder: 8 },
    { slug: 'other',          name: 'Railings & Inclusions',       sortOrder: 9 },
  ];

  for (const c of cats) {
    await db.insert(categories).values(c).onConflictDoUpdate({
      target: categories.slug,
      set: { name: c.name, sortOrder: c.sortOrder },
    });
  }
  log('Categories', cats.length);

  const rows = await db.select().from(categories);
  const idBySlug: Record<string, number> = {};
  for (const r of rows) idBySlug[r.slug] = r.id;
  return idBySlug;
}

// ---------------------------------------------------------------------------
// 4. ITEMS + OPTIONS + PACKAGE_ITEMS + OPTION_PRICES (24 Consolidated Items)
// ---------------------------------------------------------------------------

async function seedSpecifications(
  pkgIds: Record<string, number>,
  catIds: Record<string, number>,
) {
  const itemDefs: {
    slug: string;
    catSlug: string;
    name: string;
    unit: string;
    isCustomizable: boolean;
    sortOrder: number;
  }[] = [
    { slug: "steel_rebar_binding_wires", catSlug: "structure", name: "Steel Rebar Fe 550D & Binding Wires", unit: "sqft", isCustomizable: true, sortOrder: 1 },
    { slug: "cement", catSlug: "structure", name: "Cement", unit: "sqft", isCustomizable: true, sortOrder: 2 },
    { slug: "masonry_work", catSlug: "structure", name: "Masonry Work", unit: "sqft", isCustomizable: true, sortOrder: 3 },
    { slug: "basement_height", catSlug: "structure", name: "Basement Height (from ground level)", unit: "sqft", isCustomizable: true, sortOrder: 4 },
    { slug: "ceiling_height", catSlug: "structure", name: "Ceiling Height", unit: "sqft", isCustomizable: true, sortOrder: 5 },
    { slug: "waterproofing_basement_pcc", catSlug: "structure", name: "Water Proofing & Basement PCC", unit: "sqft", isCustomizable: true, sortOrder: 6 },
    { slug: "soil_testing", catSlug: "design", name: "Soil Testing", unit: "sqft", isCustomizable: true, sortOrder: 7 },
    { slug: "electrical_plumbing_drawings", catSlug: "design", name: "Electrical & Plumbing Drawings", unit: "sqft", isCustomizable: true, sortOrder: 8 },
    { slug: "isometric_vr", catSlug: "design", name: "Isometric Views & Virtual Reality", unit: "sqft", isCustomizable: true, sortOrder: 9 },
    { slug: "kitchen_wall_tiles_countertop", catSlug: "kitchen", name: "Kitchen Wall Tiles & Kitchen Countertop", unit: "sqft", isCustomizable: true, sortOrder: 10 },
    { slug: "wall_tiles", catSlug: "bathroom", name: "Wall Tiles", unit: "sqft", isCustomizable: true, sortOrder: 11 },
    { slug: "sanitary_cp_fittings", catSlug: "bathroom", name: "Sanitary & CP Fittings", unit: "sqft", isCustomizable: true, sortOrder: 12 },
    { slug: "pvc_cpvc_pipes", catSlug: "bathroom", name: "PVC and CPVC Pipes", unit: "sqft", isCustomizable: true, sortOrder: 13 },
    { slug: "main_flooring_balcony_tiles", catSlug: "flooring", name: "Main Flooring, Balcony Tiles", unit: "sqft", isCustomizable: true, sortOrder: 14 },
    { slug: "staircase", catSlug: "flooring", name: "Staircase", unit: "sqft", isCustomizable: true, sortOrder: 15 },
    { slug: "parking", catSlug: "flooring", name: "Parking", unit: "sqft", isCustomizable: true, sortOrder: 16 },
    { slug: "main_door_internal_doors", catSlug: "doors_windows", name: "Main Door & Internal Doors", unit: "sqft", isCustomizable: true, sortOrder: 17 },
    { slug: "balcony_headroom_doors", catSlug: "doors_windows", name: "Balcony & Headroom Doors", unit: "sqft", isCustomizable: true, sortOrder: 18 },
    { slug: "bathroom_doors", catSlug: "doors_windows", name: "Bathroom Doors", unit: "sqft", isCustomizable: true, sortOrder: 19 },
    { slug: "painting", catSlug: "painting", name: "PAINTING", unit: "sqft", isCustomizable: true, sortOrder: 20 },
    { slug: "wires_switches_pipes", catSlug: "electrical", name: "Wires, Switches & Pipes", unit: "sqft", isCustomizable: true, sortOrder: 21 },
    { slug: "lights", catSlug: "electrical", name: "Lights", unit: "sqft", isCustomizable: true, sortOrder: 22 },
    { slug: "staircase_balcony_railings", catSlug: "other", name: "Staircase and Balcony Railings", unit: "sqft", isCustomizable: true, sortOrder: 23 },
    { slug: "parapet_wall", catSlug: "other", name: "Parapet Wall (if headroom is built)", unit: "sqft", isCustomizable: true, sortOrder: 24 },
  ];

  for (const d of itemDefs) {
    await db.insert(items).values({
      categoryId: catIds[d.catSlug],
      slug: d.slug,
      name: d.name,
      unit: d.unit,
      isCustomizable: d.isCustomizable,
      sortOrder: d.sortOrder,
    }).onConflictDoUpdate({
      target: items.slug,
      set: {
        categoryId: catIds[d.catSlug],
        name: d.name,
        unit: d.unit,
        isCustomizable: d.isCustomizable,
        sortOrder: d.sortOrder,
      },
    });
  }
  log('Items (24 Consolidated Items)', itemDefs.length);

  // Fetch item IDs
  const itemRows = await db.select().from(items);
  const itemIdBySlug: Record<string, number> = {};
  for (const r of itemRows) itemIdBySlug[r.slug] = r.id;

  // ── Options ───────────────────────────────────────────────────────────────
  const optionDefs: {
    itemSlug: string;
    slug: string;
    brandName: string;
    specification?: string;
    isDefault: boolean;
  }[] = [
    // ── Item #1: Steel Rebar Fe 550D & Binding Wires ──
    { itemSlug: "steel_rebar_binding_wires", slug: "any_isi_steel_wire", brandName: "Any ISI Brand Steel & Wire", isDefault: true },
    { itemSlug: "steel_rebar_binding_wires", slug: "spa_vizag_tata_wire", brandName: "SPA / Vizag Steel & TATA Wire", isDefault: false },
    { itemSlug: "steel_rebar_binding_wires", slug: "ars_suryadev_tata_wire", brandName: "ARS / Suryadev / Sumangala & TATA Wire", isDefault: false },
    { itemSlug: "steel_rebar_binding_wires", slug: "jsw_tata_steel_wire", brandName: "JSW / TATA Steel & TATA Wire", isDefault: false },
    // ── Item #2: Cement ──
    { itemSlug: "cement", slug: "any_isi_cement", brandName: "Any ISI Brand Cement", isDefault: true },
    { itemSlug: "cement", slug: "jsw_cement", brandName: "JSW Cement", isDefault: false },
    { itemSlug: "cement", slug: "ramco_dalmia_cement", brandName: "Ramco / Dalmia Cement", isDefault: false },
    { itemSlug: "cement", slug: "ultratech_chettinad_cement", brandName: "Ultratech / Chettinad Cement", isDefault: false },
    // ── Item #3: Masonry Work ──
    { itemSlug: "masonry_work", slug: "solid_blocks", brandName: "Solid Blocks", isDefault: true },
    { itemSlug: "masonry_work", slug: "flyash_aac_blocks", brandName: "Fly Ash / AAC Blocks", isDefault: false },
    { itemSlug: "masonry_work", slug: "flyash_aac_premium", brandName: "Fly Ash / AAC Blocks (Premium)", isDefault: false },
    { itemSlug: "masonry_work", slug: "red_bricks", brandName: "Red Bricks", isDefault: false },
    // ── Item #4: Basement Height (from ground level) ──
    { itemSlug: "basement_height", slug: "basement_3ft_flyash", brandName: "Fly Ash Bricks upto 3 ft", isDefault: true },
    { itemSlug: "basement_height", slug: "basement_3ft_std", brandName: "Fly Ash Bricks upto 3 ft (Std)", isDefault: false },
    { itemSlug: "basement_height", slug: "basement_4ft_flyash", brandName: "Fly Ash Bricks upto 4 ft", isDefault: false },
    { itemSlug: "basement_height", slug: "basement_4_5ft_redbrick", brandName: "Fly Ash / Red Bricks upto 4.5 ft", isDefault: false },
    // ── Item #5: Ceiling Height ──
    { itemSlug: "ceiling_height", slug: "ceiling_9_5ft", brandName: "9.5 ft Ceiling Height", isDefault: true },
    { itemSlug: "ceiling_height", slug: "ceiling_10ft_std", brandName: "10 ft Ceiling Height (Std)", isDefault: false },
    { itemSlug: "ceiling_height", slug: "ceiling_10ft_prem", brandName: "10 ft Ceiling Height (Prem)", isDefault: false },
    { itemSlug: "ceiling_height", slug: "ceiling_11ft", brandName: "11 ft Ceiling Height", isDefault: false },
    // ── Item #6: Water Proofing & Basement PCC ──
    { itemSlug: "waterproofing_basement_pcc", slug: "pcc_basic_waterproofing", brandName: "Basic PCC (Waterproofing add-on)", isDefault: true },
    { itemSlug: "waterproofing_basement_pcc", slug: "pcc_dr_fixit_std", brandName: "PCC + Dr.Fixit/Fosroc/Bostik Waterproofing", isDefault: false },
    { itemSlug: "waterproofing_basement_pcc", slug: "pcc_dr_fixit_prem", brandName: "PCC + Dr.Fixit/Fosroc/Bostik Waterproofing (Prem)", isDefault: false },
    { itemSlug: "waterproofing_basement_pcc", slug: "rcc_basement_waterproofing", brandName: "RCC Basement + Dr.Fixit/Fosroc Waterproofing", isDefault: false },
    // ── Item #7: Soil Testing ──
    { itemSlug: "soil_testing", slug: "soil_testing_not_included_basic", brandName: "Soil Testing (Not Included)", isDefault: true },
    { itemSlug: "soil_testing", slug: "soil_testing_not_included_std", brandName: "Soil Testing (Not Included - Std)", isDefault: false },
    { itemSlug: "soil_testing", slug: "soil_testing_included_prem", brandName: "Soil Testing Included", isDefault: false },
    { itemSlug: "soil_testing", slug: "soil_testing_included_lux", brandName: "Soil Testing Included (Lux)", isDefault: false },
    // ── Item #8: Electrical & Plumbing Drawings ──
    { itemSlug: "electrical_plumbing_drawings", slug: "mep_drawings_basic", brandName: "MEP Drawings (Not Included)", isDefault: true },
    { itemSlug: "electrical_plumbing_drawings", slug: "mep_drawings_std", brandName: "MEP Drawings (Not Included - Std)", isDefault: false },
    { itemSlug: "electrical_plumbing_drawings", slug: "mep_drawings_included_prem", brandName: "MEP Drawings Included", isDefault: false },
    { itemSlug: "electrical_plumbing_drawings", slug: "mep_drawings_included_lux", brandName: "MEP Drawings Included (Lux)", isDefault: false },
    // ── Item #9: Isometric Views & Virtual Reality ──
    { itemSlug: "isometric_vr", slug: "iso_vr_not_included_basic", brandName: "Isometric Views & VR (Not Included)", isDefault: true },
    { itemSlug: "isometric_vr", slug: "iso_vr_not_included_std", brandName: "Isometric Views & VR (Not Included - Std)", isDefault: false },
    { itemSlug: "isometric_vr", slug: "iso_vr_not_included_prem", brandName: "Isometric Views & VR (Not Included - Prem)", isDefault: false },
    { itemSlug: "isometric_vr", slug: "iso_vr_included_lux", brandName: "Isometric Views & VR 3D Walkthrough Included", isDefault: false },
    // ── Item #10: Kitchen Wall Tiles & Kitchen Countertop ──
    { itemSlug: "kitchen_wall_tiles_countertop", slug: "kitchen_tiles_slab_basic", brandName: "2.5 ft Tiles + Granite Slab upto 15 rft", isDefault: true },
    { itemSlug: "kitchen_wall_tiles_countertop", slug: "kitchen_tiles_slab_std", brandName: "4 ft Tiles + Granite Slab upto 15 rft", isDefault: false },
    { itemSlug: "kitchen_wall_tiles_countertop", slug: "kitchen_tiles_slab_prem", brandName: "Roof Height Tiles + Granite Slab upto 20 rft", isDefault: false },
    { itemSlug: "kitchen_wall_tiles_countertop", slug: "kitchen_tiles_slab_lux", brandName: "Roof Height Tiles + Premium Granite upto 25 rft", isDefault: false },
    // ── Item #11: Wall Tiles ──
    { itemSlug: "wall_tiles", slug: "wall_tiles_7ft_basic", brandName: "7 ft coverage @ \u20b935/sq.ft", isDefault: true },
    { itemSlug: "wall_tiles", slug: "wall_tiles_7ft_std", brandName: "7 ft coverage @ \u20b945/sq.ft", isDefault: false },
    { itemSlug: "wall_tiles", slug: "wall_tiles_10ft_prem", brandName: "10 ft coverage @ \u20b955/sq.ft", isDefault: false },
    { itemSlug: "wall_tiles", slug: "wall_tiles_11ft_lux", brandName: "11 ft coverage @ \u20b975/sq.ft", isDefault: false },
    // ── Item #12: Sanitary & CP Fittings ──
    { itemSlug: "sanitary_cp_fittings", slug: "sanitary_any_isi", brandName: "Any ISI Brand Sanitary & CP", isDefault: true },
    { itemSlug: "sanitary_cp_fittings", slug: "sanitary_parryware", brandName: "Parryware (\u20b920,000/bath allowance)", isDefault: false },
    { itemSlug: "sanitary_cp_fittings", slug: "sanitary_jaquar", brandName: "Jaquar (\u20b930,000/bath allowance)", isDefault: false },
    { itemSlug: "sanitary_cp_fittings", slug: "sanitary_toto_kohler", brandName: "Toto / Kohler (\u20b945,000/bath allowance)", isDefault: false },
    // ── Item #13: PVC and CPVC Pipes ──
    { itemSlug: "pvc_cpvc_pipes", slug: "pipes_any_isi", brandName: "Any ISI Brand Pipes", isDefault: true },
    { itemSlug: "pvc_cpvc_pipes", slug: "pipes_watertec", brandName: "Watertec Pipes", isDefault: false },
    { itemSlug: "pvc_cpvc_pipes", slug: "pipes_kavery_ashirwad", brandName: "Kavery / Ashirwad Pipes", isDefault: false },
    { itemSlug: "pvc_cpvc_pipes", slug: "pipes_finolex_supreme", brandName: "Finolex / Supreme Pipes", isDefault: false },
    // ── Item #14: Main Flooring, Balcony Tiles ──
    { itemSlug: "main_flooring_balcony_tiles", slug: "flooring_tiles_basic", brandName: "2'x2' Main (\u20b945/sqft) + 1'x1' Balcony (\u20b935/sqft)", isDefault: true },
    { itemSlug: "main_flooring_balcony_tiles", slug: "flooring_tiles_std", brandName: "4'x2' Main (\u20b950/sqft) + 2'x2' Balcony (\u20b950/sqft)", isDefault: false },
    { itemSlug: "main_flooring_balcony_tiles", slug: "flooring_tiles_prem", brandName: "4'x2' Main (\u20b970/sqft) + 2'x2' Balcony (\u20b960/sqft)", isDefault: false },
    { itemSlug: "main_flooring_balcony_tiles", slug: "flooring_tiles_lux", brandName: "Premium Tiles (\u20b9100/sqft) + Balcony (\u20b985/sqft)", isDefault: false },
    // ── Item #15: Staircase ──
    { itemSlug: "staircase", slug: "staircase_tiles_basic", brandName: "1'x1' Tiles @ \u20b935/sq.ft", isDefault: true },
    { itemSlug: "staircase", slug: "staircase_tiles_std", brandName: "2'x2' Tiles @ \u20b950/sq.ft", isDefault: false },
    { itemSlug: "staircase", slug: "staircase_granite_prem", brandName: "Granite @ \u20b9120/sq.ft", isDefault: false },
    { itemSlug: "staircase", slug: "staircase_granite_lux", brandName: "Premium Granite @ \u20b9160/sq.ft", isDefault: false },
    // ── Item #16: Parking ──
    { itemSlug: "parking", slug: "parking_tiles_basic", brandName: "Tiles @ \u20b945/sq.ft", isDefault: true },
    { itemSlug: "parking", slug: "parking_tiles_std", brandName: "Tiles @ \u20b950/sq.ft", isDefault: false },
    { itemSlug: "parking", slug: "parking_tiles_prem", brandName: "Heavy Duty Tiles @ \u20b970/sq.ft", isDefault: false },
    { itemSlug: "parking", slug: "parking_tiles_lux", brandName: "Premium Parking Tiles @ \u20b9100/sq.ft", isDefault: false },
    // ── Item #17: Main Door & Internal Doors ──
    { itemSlug: "main_door_internal_doors", slug: "doors_basic", brandName: "Readymade Teak 5\"x3\" + Flush Doors (Sal Frame)", isDefault: true },
    { itemSlug: "main_door_internal_doors", slug: "doors_std", brandName: "Readymade Teak 5\"x4\" + Laminated Flush Doors", isDefault: false },
    { itemSlug: "main_door_internal_doors", slug: "doors_prem", brandName: "1st Quality Teak 5\"x4\" + Teak Doors (4\"x3\" Frame)", isDefault: false },
    { itemSlug: "main_door_internal_doors", slug: "doors_lux", brandName: "1st Quality Burma Teak 5\"x4\" + Burma Teak Doors", isDefault: false },
    // ── Item #18: Balcony & Headroom Doors ──
    { itemSlug: "balcony_headroom_doors", slug: "balcony_headroom_basic", brandName: "Flush Door, Sal/Mahogany Frame", isDefault: true },
    { itemSlug: "balcony_headroom_doors", slug: "balcony_headroom_std", brandName: "Flush Door, Sal/Mahogany Frame (Std)", isDefault: false },
    { itemSlug: "balcony_headroom_doors", slug: "balcony_headroom_prem", brandName: "Flush Doors with Grill (or) Steel Doors", isDefault: false },
    { itemSlug: "balcony_headroom_doors", slug: "balcony_headroom_lux", brandName: "Flush Doors with Grill (or) Steel Doors (Lux)", isDefault: false },
    // ── Item #19: Bathroom Doors ──
    { itemSlug: "bathroom_doors", slug: "bathroom_doors_pvc", brandName: "PVC Doors", isDefault: true },
    { itemSlug: "bathroom_doors", slug: "bathroom_doors_wpc", brandName: "WPC Doors", isDefault: false },
    { itemSlug: "bathroom_doors", slug: "bathroom_doors_lam_wpc", brandName: "Laminated WPC Doors", isDefault: false },
    { itemSlug: "bathroom_doors", slug: "bathroom_doors_frp", brandName: "FRP Doors", isDefault: false },
    // ── Item #20: PAINTING ──
    { itemSlug: "painting", slug: "paint_basic", brandName: "1 Putty + 1 Primer + 2 ISI Emulsion (Interior/Exterior)", isDefault: true },
    { itemSlug: "painting", slug: "paint_std", brandName: "2 JSW Putty + Asian Primer + Tractor/Ace Emulsion", isDefault: false },
    { itemSlug: "painting", slug: "paint_prem", brandName: "2 Asian Putty + Asian Primer + Premium/Apex Emulsion", isDefault: false },
    { itemSlug: "painting", slug: "paint_lux", brandName: "3 Asian Putty + Waterproof Primer + Royale/Ultima Protek", isDefault: false },
    // ── Item #21: Wires, Switches & Pipes ──
    { itemSlug: "wires_switches_pipes", slug: "elec_basic", brandName: "Any ISI Brand Wires, Switches & Pipes", isDefault: true },
    { itemSlug: "wires_switches_pipes", slug: "elec_std", brandName: "RR/Orbit Wires + Anchor Roma + Anchor/Finolex Pipes", isDefault: false },
    { itemSlug: "wires_switches_pipes", slug: "elec_prem", brandName: "Finolex Wires + Legrand/GM + Anchor/Finolex Pipes", isDefault: false },
    { itemSlug: "wires_switches_pipes", slug: "elec_lux", brandName: "Finolex Wires + Legrand/GM + Vasavi Pipes", isDefault: false },
    // ── Item #22: Lights ──
    { itemSlug: "lights", slug: "lights_any_isi", brandName: "Any ISI Brand Lights", isDefault: true },
    { itemSlug: "lights", slug: "lights_luker", brandName: "Luker Lights", isDefault: false },
    { itemSlug: "lights", slug: "lights_philips", brandName: "Philips Lights", isDefault: false },
    { itemSlug: "lights", slug: "lights_philips_lux", brandName: "Philips Lights (Lux)", isDefault: false },
    // ── Item #23: Staircase and Balcony Railings ──
    { itemSlug: "staircase_balcony_railings", slug: "railings_ms_basic", brandName: "MS Railings", isDefault: true },
    { itemSlug: "staircase_balcony_railings", slug: "railings_ms_std", brandName: "MS Railings (Std)", isDefault: false },
    { itemSlug: "staircase_balcony_railings", slug: "railings_ss_prem", brandName: "SS 304 Grade Railings", isDefault: false },
    { itemSlug: "staircase_balcony_railings", slug: "railings_glass_lux", brandName: "Toughened Glass with SS/Wood/Aluminium", isDefault: false },
    // ── Item #24: Parapet Wall (if headroom is built) ──
    { itemSlug: "parapet_wall", slug: "parapet_3ft_4_5in_basic", brandName: "3 ft - 4.5\" thick", isDefault: true },
    { itemSlug: "parapet_wall", slug: "parapet_3ft_4_5in_std", brandName: "3 ft - 4.5\" thick (Std)", isDefault: false },
    { itemSlug: "parapet_wall", slug: "parapet_3ft_9in_prem", brandName: "3 ft - 9\" thick", isDefault: false },
    { itemSlug: "parapet_wall", slug: "parapet_3_5ft_9in_lux", brandName: "3.5 ft - 9\" thick", isDefault: false },
  ];

  const existingOptions = await db.select().from(options);
  for (const o of optionDefs) {
    const itmId = itemIdBySlug[o.itemSlug];
    if (!itmId) continue;
    
    const existing = existingOptions.find(ex => ex.itemId === itmId && ex.slug === o.slug);
    if (existing) {
      await db.update(options).set({
        brandName: o.brandName,
        isDefault: o.isDefault,
      }).where(eq(options.id, existing.id));
    } else {
      await db.insert(options).values({
        itemId: itmId,
        slug: o.slug,
        brandName: o.brandName,
        specification: o.specification,
        isDefault: o.isDefault,
      });
    }
  }
  log('Options (96 Variant Options)', optionDefs.length);

  // Fetch option IDs
  const optionRows = await db.select().from(options);
  const optIdBySlug: Record<string, number> = {};
  for (const r of optionRows) optIdBySlug[r.slug] = r.id;

  // ── Package Items (Defaults per Package) ──────────────────────────────────
  type PackageItemDef = {
    pkgSlug: string;
    itemSlug: string;
    defaultOptionSlug?: string;
    includedCoverage?: string;
    isIncluded: boolean;
    additionalCostPrice: string;
  };

  const piDefs: PackageItemDef[] = [
    // ── Item #1: Steel Rebar Fe 550D & Binding Wires ──
    { pkgSlug: "basic", itemSlug: "steel_rebar_binding_wires", defaultOptionSlug: "any_isi_steel_wire", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "standard", itemSlug: "steel_rebar_binding_wires", defaultOptionSlug: "spa_vizag_tata_wire", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "premium", itemSlug: "steel_rebar_binding_wires", defaultOptionSlug: "ars_suryadev_tata_wire", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "luxury", itemSlug: "steel_rebar_binding_wires", defaultOptionSlug: "jsw_tata_steel_wire", isIncluded: true, additionalCostPrice: '0.00' },
    // ── Item #2: Cement ──
    { pkgSlug: "basic", itemSlug: "cement", defaultOptionSlug: "any_isi_cement", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "standard", itemSlug: "cement", defaultOptionSlug: "jsw_cement", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "premium", itemSlug: "cement", defaultOptionSlug: "ramco_dalmia_cement", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "luxury", itemSlug: "cement", defaultOptionSlug: "ultratech_chettinad_cement", isIncluded: true, additionalCostPrice: '0.00' },
    // ── Item #3: Masonry Work ──
    { pkgSlug: "basic", itemSlug: "masonry_work", defaultOptionSlug: "solid_blocks", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "standard", itemSlug: "masonry_work", defaultOptionSlug: "flyash_aac_blocks", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "premium", itemSlug: "masonry_work", defaultOptionSlug: "flyash_aac_premium", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "luxury", itemSlug: "masonry_work", defaultOptionSlug: "red_bricks", isIncluded: true, additionalCostPrice: '0.00' },
    // ── Item #4: Basement Height (from ground level) ──
    { pkgSlug: "basic", itemSlug: "basement_height", defaultOptionSlug: "basement_3ft_flyash", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "standard", itemSlug: "basement_height", defaultOptionSlug: "basement_3ft_std", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "premium", itemSlug: "basement_height", defaultOptionSlug: "basement_4ft_flyash", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "luxury", itemSlug: "basement_height", defaultOptionSlug: "basement_4_5ft_redbrick", isIncluded: true, additionalCostPrice: '0.00' },
    // ── Item #5: Ceiling Height ──
    { pkgSlug: "basic", itemSlug: "ceiling_height", defaultOptionSlug: "ceiling_9_5ft", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "standard", itemSlug: "ceiling_height", defaultOptionSlug: "ceiling_10ft_std", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "premium", itemSlug: "ceiling_height", defaultOptionSlug: "ceiling_10ft_prem", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "luxury", itemSlug: "ceiling_height", defaultOptionSlug: "ceiling_11ft", isIncluded: true, additionalCostPrice: '0.00' },
    // ── Item #6: Water Proofing & Basement PCC ──
    { pkgSlug: "basic", itemSlug: "waterproofing_basement_pcc", defaultOptionSlug: "pcc_basic_waterproofing", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "standard", itemSlug: "waterproofing_basement_pcc", defaultOptionSlug: "pcc_dr_fixit_std", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "premium", itemSlug: "waterproofing_basement_pcc", defaultOptionSlug: "pcc_dr_fixit_prem", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "luxury", itemSlug: "waterproofing_basement_pcc", defaultOptionSlug: "rcc_basement_waterproofing", isIncluded: true, additionalCostPrice: '0.00' },
    // ── Item #7: Soil Testing ──
    { pkgSlug: "basic", itemSlug: "soil_testing", defaultOptionSlug: "soil_testing_not_included_basic", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "standard", itemSlug: "soil_testing", defaultOptionSlug: "soil_testing_not_included_std", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "premium", itemSlug: "soil_testing", defaultOptionSlug: "soil_testing_included_prem", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "luxury", itemSlug: "soil_testing", defaultOptionSlug: "soil_testing_included_lux", isIncluded: true, additionalCostPrice: '0.00' },
    // ── Item #8: Electrical & Plumbing Drawings ──
    { pkgSlug: "basic", itemSlug: "electrical_plumbing_drawings", defaultOptionSlug: "mep_drawings_basic", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "standard", itemSlug: "electrical_plumbing_drawings", defaultOptionSlug: "mep_drawings_std", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "premium", itemSlug: "electrical_plumbing_drawings", defaultOptionSlug: "mep_drawings_included_prem", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "luxury", itemSlug: "electrical_plumbing_drawings", defaultOptionSlug: "mep_drawings_included_lux", isIncluded: true, additionalCostPrice: '0.00' },
    // ── Item #9: Isometric Views & Virtual Reality ──
    { pkgSlug: "basic", itemSlug: "isometric_vr", defaultOptionSlug: "iso_vr_not_included_basic", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "standard", itemSlug: "isometric_vr", defaultOptionSlug: "iso_vr_not_included_std", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "premium", itemSlug: "isometric_vr", defaultOptionSlug: "iso_vr_not_included_prem", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "luxury", itemSlug: "isometric_vr", defaultOptionSlug: "iso_vr_included_lux", isIncluded: true, additionalCostPrice: '0.00' },
    // ── Item #10: Kitchen Wall Tiles & Kitchen Countertop ──
    { pkgSlug: "basic", itemSlug: "kitchen_wall_tiles_countertop", defaultOptionSlug: "kitchen_tiles_slab_basic", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "standard", itemSlug: "kitchen_wall_tiles_countertop", defaultOptionSlug: "kitchen_tiles_slab_std", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "premium", itemSlug: "kitchen_wall_tiles_countertop", defaultOptionSlug: "kitchen_tiles_slab_prem", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "luxury", itemSlug: "kitchen_wall_tiles_countertop", defaultOptionSlug: "kitchen_tiles_slab_lux", isIncluded: true, additionalCostPrice: '0.00' },
    // ── Item #11: Wall Tiles ──
    { pkgSlug: "basic", itemSlug: "wall_tiles", defaultOptionSlug: "wall_tiles_7ft_basic", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "standard", itemSlug: "wall_tiles", defaultOptionSlug: "wall_tiles_7ft_std", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "premium", itemSlug: "wall_tiles", defaultOptionSlug: "wall_tiles_10ft_prem", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "luxury", itemSlug: "wall_tiles", defaultOptionSlug: "wall_tiles_11ft_lux", isIncluded: true, additionalCostPrice: '0.00' },
    // ── Item #12: Sanitary & CP Fittings ──
    { pkgSlug: "basic", itemSlug: "sanitary_cp_fittings", defaultOptionSlug: "sanitary_any_isi", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "standard", itemSlug: "sanitary_cp_fittings", defaultOptionSlug: "sanitary_parryware", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "premium", itemSlug: "sanitary_cp_fittings", defaultOptionSlug: "sanitary_jaquar", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "luxury", itemSlug: "sanitary_cp_fittings", defaultOptionSlug: "sanitary_toto_kohler", isIncluded: true, additionalCostPrice: '0.00' },
    // ── Item #13: PVC and CPVC Pipes ──
    { pkgSlug: "basic", itemSlug: "pvc_cpvc_pipes", defaultOptionSlug: "pipes_any_isi", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "standard", itemSlug: "pvc_cpvc_pipes", defaultOptionSlug: "pipes_watertec", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "premium", itemSlug: "pvc_cpvc_pipes", defaultOptionSlug: "pipes_kavery_ashirwad", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "luxury", itemSlug: "pvc_cpvc_pipes", defaultOptionSlug: "pipes_finolex_supreme", isIncluded: true, additionalCostPrice: '0.00' },
    // ── Item #14: Main Flooring, Balcony Tiles ──
    { pkgSlug: "basic", itemSlug: "main_flooring_balcony_tiles", defaultOptionSlug: "flooring_tiles_basic", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "standard", itemSlug: "main_flooring_balcony_tiles", defaultOptionSlug: "flooring_tiles_std", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "premium", itemSlug: "main_flooring_balcony_tiles", defaultOptionSlug: "flooring_tiles_prem", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "luxury", itemSlug: "main_flooring_balcony_tiles", defaultOptionSlug: "flooring_tiles_lux", isIncluded: true, additionalCostPrice: '0.00' },
    // ── Item #15: Staircase ──
    { pkgSlug: "basic", itemSlug: "staircase", defaultOptionSlug: "staircase_tiles_basic", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "standard", itemSlug: "staircase", defaultOptionSlug: "staircase_tiles_std", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "premium", itemSlug: "staircase", defaultOptionSlug: "staircase_granite_prem", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "luxury", itemSlug: "staircase", defaultOptionSlug: "staircase_granite_lux", isIncluded: true, additionalCostPrice: '0.00' },
    // ── Item #16: Parking ──
    { pkgSlug: "basic", itemSlug: "parking", defaultOptionSlug: "parking_tiles_basic", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "standard", itemSlug: "parking", defaultOptionSlug: "parking_tiles_std", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "premium", itemSlug: "parking", defaultOptionSlug: "parking_tiles_prem", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "luxury", itemSlug: "parking", defaultOptionSlug: "parking_tiles_lux", isIncluded: true, additionalCostPrice: '0.00' },
    // ── Item #17: Main Door & Internal Doors ──
    { pkgSlug: "basic", itemSlug: "main_door_internal_doors", defaultOptionSlug: "doors_basic", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "standard", itemSlug: "main_door_internal_doors", defaultOptionSlug: "doors_std", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "premium", itemSlug: "main_door_internal_doors", defaultOptionSlug: "doors_prem", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "luxury", itemSlug: "main_door_internal_doors", defaultOptionSlug: "doors_lux", isIncluded: true, additionalCostPrice: '0.00' },
    // ── Item #18: Balcony & Headroom Doors ──
    { pkgSlug: "basic", itemSlug: "balcony_headroom_doors", defaultOptionSlug: "balcony_headroom_basic", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "standard", itemSlug: "balcony_headroom_doors", defaultOptionSlug: "balcony_headroom_std", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "premium", itemSlug: "balcony_headroom_doors", defaultOptionSlug: "balcony_headroom_prem", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "luxury", itemSlug: "balcony_headroom_doors", defaultOptionSlug: "balcony_headroom_lux", isIncluded: true, additionalCostPrice: '0.00' },
    // ── Item #19: Bathroom Doors ──
    { pkgSlug: "basic", itemSlug: "bathroom_doors", defaultOptionSlug: "bathroom_doors_pvc", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "standard", itemSlug: "bathroom_doors", defaultOptionSlug: "bathroom_doors_wpc", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "premium", itemSlug: "bathroom_doors", defaultOptionSlug: "bathroom_doors_lam_wpc", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "luxury", itemSlug: "bathroom_doors", defaultOptionSlug: "bathroom_doors_frp", isIncluded: true, additionalCostPrice: '0.00' },
    // ── Item #20: PAINTING ──
    { pkgSlug: "basic", itemSlug: "painting", defaultOptionSlug: "paint_basic", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "standard", itemSlug: "painting", defaultOptionSlug: "paint_std", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "premium", itemSlug: "painting", defaultOptionSlug: "paint_prem", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "luxury", itemSlug: "painting", defaultOptionSlug: "paint_lux", isIncluded: true, additionalCostPrice: '0.00' },
    // ── Item #21: Wires, Switches & Pipes ──
    { pkgSlug: "basic", itemSlug: "wires_switches_pipes", defaultOptionSlug: "elec_basic", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "standard", itemSlug: "wires_switches_pipes", defaultOptionSlug: "elec_std", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "premium", itemSlug: "wires_switches_pipes", defaultOptionSlug: "elec_prem", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "luxury", itemSlug: "wires_switches_pipes", defaultOptionSlug: "elec_lux", isIncluded: true, additionalCostPrice: '0.00' },
    // ── Item #22: Lights ──
    { pkgSlug: "basic", itemSlug: "lights", defaultOptionSlug: "lights_any_isi", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "standard", itemSlug: "lights", defaultOptionSlug: "lights_luker", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "premium", itemSlug: "lights", defaultOptionSlug: "lights_philips", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "luxury", itemSlug: "lights", defaultOptionSlug: "lights_philips_lux", isIncluded: true, additionalCostPrice: '0.00' },
    // ── Item #23: Staircase and Balcony Railings ──
    { pkgSlug: "basic", itemSlug: "staircase_balcony_railings", defaultOptionSlug: "railings_ms_basic", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "standard", itemSlug: "staircase_balcony_railings", defaultOptionSlug: "railings_ms_std", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "premium", itemSlug: "staircase_balcony_railings", defaultOptionSlug: "railings_ss_prem", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "luxury", itemSlug: "staircase_balcony_railings", defaultOptionSlug: "railings_glass_lux", isIncluded: true, additionalCostPrice: '0.00' },
    // ── Item #24: Parapet Wall (if headroom is built) ──
    { pkgSlug: "basic", itemSlug: "parapet_wall", defaultOptionSlug: "parapet_3ft_4_5in_basic", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "standard", itemSlug: "parapet_wall", defaultOptionSlug: "parapet_3ft_4_5in_std", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "premium", itemSlug: "parapet_wall", defaultOptionSlug: "parapet_3ft_9in_prem", isIncluded: true, additionalCostPrice: '0.00' },
    { pkgSlug: "luxury", itemSlug: "parapet_wall", defaultOptionSlug: "parapet_3_5ft_9in_lux", isIncluded: true, additionalCostPrice: '0.00' },
  ];

  const existingPIs = await db.select().from(packageItems);
  for (const d of piDefs) {
    const pId = pkgIds[d.pkgSlug];
    const itmId = itemIdBySlug[d.itemSlug];
    const optId = d.defaultOptionSlug ? optIdBySlug[d.defaultOptionSlug] : null;

    const existing = existingPIs.find(ex => ex.packageId === pId && ex.itemId === itmId);
    if (existing) {
      await db.update(packageItems).set({
        defaultOptionId: optId,
        isIncluded: d.isIncluded,
        additionalCostPrice: d.additionalCostPrice,
      }).where(eq(packageItems.id, existing.id));
    } else {
      await db.insert(packageItems).values({
        packageId: pId,
        itemId: itmId,
        defaultOptionId: optId,
        includedCoverage: d.includedCoverage ?? null,
        isIncluded: d.isIncluded,
        additionalCostPrice: d.additionalCostPrice,
      });
    }
  }
  log('Package Items (96 package × item mappings)', piDefs.length);

  // ── Option Prices (Upgrade Deltas) ─────────────────────────────────────────
  const opDefs: {
    optionSlug: string;
    packageSlug: string;
    priceDelta: string;
    priceType: string;
  }[] = [
    // ── Item #1: Steel Rebar Fe 550D & Binding Wires ──
    { optionSlug: "any_isi_steel_wire", packageSlug: "standard", priceDelta: '-15.00', priceType: 'per_sqft' },
    { optionSlug: "any_isi_steel_wire", packageSlug: "premium", priceDelta: '-45.00', priceType: 'per_sqft' },
    { optionSlug: "any_isi_steel_wire", packageSlug: "luxury", priceDelta: '-95.00', priceType: 'per_sqft' },
    { optionSlug: "spa_vizag_tata_wire", packageSlug: "basic", priceDelta: '15.00', priceType: 'per_sqft' },
    { optionSlug: "spa_vizag_tata_wire", packageSlug: "premium", priceDelta: '-30.00', priceType: 'per_sqft' },
    { optionSlug: "spa_vizag_tata_wire", packageSlug: "luxury", priceDelta: '-80.00', priceType: 'per_sqft' },
    { optionSlug: "ars_suryadev_tata_wire", packageSlug: "basic", priceDelta: '45.00', priceType: 'per_sqft' },
    { optionSlug: "ars_suryadev_tata_wire", packageSlug: "standard", priceDelta: '30.00', priceType: 'per_sqft' },
    { optionSlug: "ars_suryadev_tata_wire", packageSlug: "luxury", priceDelta: '-50.00', priceType: 'per_sqft' },
    { optionSlug: "jsw_tata_steel_wire", packageSlug: "basic", priceDelta: '95.00', priceType: 'per_sqft' },
    { optionSlug: "jsw_tata_steel_wire", packageSlug: "standard", priceDelta: '80.00', priceType: 'per_sqft' },
    { optionSlug: "jsw_tata_steel_wire", packageSlug: "premium", priceDelta: '50.00', priceType: 'per_sqft' },
    // ── Item #2: Cement ──
    { optionSlug: "any_isi_cement", packageSlug: "standard", priceDelta: '-5.00', priceType: 'per_sqft' },
    { optionSlug: "any_isi_cement", packageSlug: "premium", priceDelta: '-15.00', priceType: 'per_sqft' },
    { optionSlug: "any_isi_cement", packageSlug: "luxury", priceDelta: '-35.00', priceType: 'per_sqft' },
    { optionSlug: "jsw_cement", packageSlug: "basic", priceDelta: '5.00', priceType: 'per_sqft' },
    { optionSlug: "jsw_cement", packageSlug: "premium", priceDelta: '-10.00', priceType: 'per_sqft' },
    { optionSlug: "jsw_cement", packageSlug: "luxury", priceDelta: '-30.00', priceType: 'per_sqft' },
    { optionSlug: "ramco_dalmia_cement", packageSlug: "basic", priceDelta: '15.00', priceType: 'per_sqft' },
    { optionSlug: "ramco_dalmia_cement", packageSlug: "standard", priceDelta: '10.00', priceType: 'per_sqft' },
    { optionSlug: "ramco_dalmia_cement", packageSlug: "luxury", priceDelta: '-20.00', priceType: 'per_sqft' },
    { optionSlug: "ultratech_chettinad_cement", packageSlug: "basic", priceDelta: '35.00', priceType: 'per_sqft' },
    { optionSlug: "ultratech_chettinad_cement", packageSlug: "standard", priceDelta: '30.00', priceType: 'per_sqft' },
    { optionSlug: "ultratech_chettinad_cement", packageSlug: "premium", priceDelta: '20.00', priceType: 'per_sqft' },
    // ── Item #3: Masonry Work ──
    { optionSlug: "solid_blocks", packageSlug: "standard", priceDelta: '-20.00', priceType: 'per_sqft' },
    { optionSlug: "solid_blocks", packageSlug: "premium", priceDelta: '-20.00', priceType: 'per_sqft' },
    { optionSlug: "solid_blocks", packageSlug: "luxury", priceDelta: '-130.00', priceType: 'per_sqft' },
    { optionSlug: "flyash_aac_blocks", packageSlug: "basic", priceDelta: '20.00', priceType: 'per_sqft' },
    { optionSlug: "flyash_aac_blocks", packageSlug: "luxury", priceDelta: '-110.00', priceType: 'per_sqft' },
    { optionSlug: "flyash_aac_premium", packageSlug: "basic", priceDelta: '20.00', priceType: 'per_sqft' },
    { optionSlug: "flyash_aac_premium", packageSlug: "luxury", priceDelta: '-110.00', priceType: 'per_sqft' },
    { optionSlug: "red_bricks", packageSlug: "basic", priceDelta: '130.00', priceType: 'per_sqft' },
    { optionSlug: "red_bricks", packageSlug: "standard", priceDelta: '110.00', priceType: 'per_sqft' },
    { optionSlug: "red_bricks", packageSlug: "premium", priceDelta: '110.00', priceType: 'per_sqft' },
    // ── Item #4: Basement Height (from ground level) ──
    { optionSlug: "basement_3ft_flyash", packageSlug: "premium", priceDelta: '-20.00', priceType: 'per_sqft' },
    { optionSlug: "basement_3ft_flyash", packageSlug: "luxury", priceDelta: '-40.00', priceType: 'per_sqft' },
    { optionSlug: "basement_3ft_std", packageSlug: "premium", priceDelta: '-20.00', priceType: 'per_sqft' },
    { optionSlug: "basement_3ft_std", packageSlug: "luxury", priceDelta: '-40.00', priceType: 'per_sqft' },
    { optionSlug: "basement_4ft_flyash", packageSlug: "basic", priceDelta: '20.00', priceType: 'per_sqft' },
    { optionSlug: "basement_4ft_flyash", packageSlug: "standard", priceDelta: '20.00', priceType: 'per_sqft' },
    { optionSlug: "basement_4ft_flyash", packageSlug: "luxury", priceDelta: '-20.00', priceType: 'per_sqft' },
    { optionSlug: "basement_4_5ft_redbrick", packageSlug: "basic", priceDelta: '40.00', priceType: 'per_sqft' },
    { optionSlug: "basement_4_5ft_redbrick", packageSlug: "standard", priceDelta: '40.00', priceType: 'per_sqft' },
    { optionSlug: "basement_4_5ft_redbrick", packageSlug: "premium", priceDelta: '20.00', priceType: 'per_sqft' },
    // ── Item #5: Ceiling Height ──
    { optionSlug: "ceiling_9_5ft", packageSlug: "standard", priceDelta: '-25.00', priceType: 'per_sqft' },
    { optionSlug: "ceiling_9_5ft", packageSlug: "premium", priceDelta: '-70.00', priceType: 'per_sqft' },
    { optionSlug: "ceiling_9_5ft", packageSlug: "luxury", priceDelta: '-70.00', priceType: 'per_sqft' },
    { optionSlug: "ceiling_10ft_std", packageSlug: "basic", priceDelta: '25.00', priceType: 'per_sqft' },
    { optionSlug: "ceiling_10ft_std", packageSlug: "premium", priceDelta: '-45.00', priceType: 'per_sqft' },
    { optionSlug: "ceiling_10ft_std", packageSlug: "luxury", priceDelta: '-45.00', priceType: 'per_sqft' },
    { optionSlug: "ceiling_10ft_prem", packageSlug: "basic", priceDelta: '70.00', priceType: 'per_sqft' },
    { optionSlug: "ceiling_10ft_prem", packageSlug: "standard", priceDelta: '45.00', priceType: 'per_sqft' },
    { optionSlug: "ceiling_11ft", packageSlug: "basic", priceDelta: '70.00', priceType: 'per_sqft' },
    { optionSlug: "ceiling_11ft", packageSlug: "standard", priceDelta: '45.00', priceType: 'per_sqft' },
    // ── Item #6: Water Proofing & Basement PCC ──
    { optionSlug: "pcc_basic_waterproofing", packageSlug: "standard", priceDelta: '-10.00', priceType: 'per_sqft' },
    { optionSlug: "pcc_basic_waterproofing", packageSlug: "premium", priceDelta: '-10.00', priceType: 'per_sqft' },
    { optionSlug: "pcc_basic_waterproofing", packageSlug: "luxury", priceDelta: '-50.00', priceType: 'per_sqft' },
    { optionSlug: "pcc_dr_fixit_std", packageSlug: "basic", priceDelta: '10.00', priceType: 'per_sqft' },
    { optionSlug: "pcc_dr_fixit_std", packageSlug: "luxury", priceDelta: '-40.00', priceType: 'per_sqft' },
    { optionSlug: "pcc_dr_fixit_prem", packageSlug: "basic", priceDelta: '10.00', priceType: 'per_sqft' },
    { optionSlug: "pcc_dr_fixit_prem", packageSlug: "luxury", priceDelta: '-40.00', priceType: 'per_sqft' },
    { optionSlug: "rcc_basement_waterproofing", packageSlug: "basic", priceDelta: '50.00', priceType: 'per_sqft' },
    { optionSlug: "rcc_basement_waterproofing", packageSlug: "standard", priceDelta: '40.00', priceType: 'per_sqft' },
    { optionSlug: "rcc_basement_waterproofing", packageSlug: "premium", priceDelta: '40.00', priceType: 'per_sqft' },
    // ── Item #7: Soil Testing ──
    { optionSlug: "soil_testing_not_included_basic", packageSlug: "premium", priceDelta: '-40.00', priceType: 'per_sqft' },
    { optionSlug: "soil_testing_not_included_basic", packageSlug: "luxury", priceDelta: '-40.00', priceType: 'per_sqft' },
    { optionSlug: "soil_testing_not_included_std", packageSlug: "premium", priceDelta: '-40.00', priceType: 'per_sqft' },
    { optionSlug: "soil_testing_not_included_std", packageSlug: "luxury", priceDelta: '-40.00', priceType: 'per_sqft' },
    { optionSlug: "soil_testing_included_prem", packageSlug: "basic", priceDelta: '40.00', priceType: 'per_sqft' },
    { optionSlug: "soil_testing_included_prem", packageSlug: "standard", priceDelta: '40.00', priceType: 'per_sqft' },
    { optionSlug: "soil_testing_included_lux", packageSlug: "basic", priceDelta: '40.00', priceType: 'per_sqft' },
    { optionSlug: "soil_testing_included_lux", packageSlug: "standard", priceDelta: '40.00', priceType: 'per_sqft' },
    // ── Item #8: Electrical & Plumbing Drawings ──
    { optionSlug: "mep_drawings_basic", packageSlug: "premium", priceDelta: '-12.00', priceType: 'per_sqft' },
    { optionSlug: "mep_drawings_basic", packageSlug: "luxury", priceDelta: '-12.00', priceType: 'per_sqft' },
    { optionSlug: "mep_drawings_std", packageSlug: "premium", priceDelta: '-12.00', priceType: 'per_sqft' },
    { optionSlug: "mep_drawings_std", packageSlug: "luxury", priceDelta: '-12.00', priceType: 'per_sqft' },
    { optionSlug: "mep_drawings_included_prem", packageSlug: "basic", priceDelta: '12.00', priceType: 'per_sqft' },
    { optionSlug: "mep_drawings_included_prem", packageSlug: "standard", priceDelta: '12.00', priceType: 'per_sqft' },
    { optionSlug: "mep_drawings_included_lux", packageSlug: "basic", priceDelta: '12.00', priceType: 'per_sqft' },
    { optionSlug: "mep_drawings_included_lux", packageSlug: "standard", priceDelta: '12.00', priceType: 'per_sqft' },
    // ── Item #9: Isometric Views & Virtual Reality ──
    { optionSlug: "iso_vr_not_included_basic", packageSlug: "luxury", priceDelta: '-50.00', priceType: 'per_sqft' },
    { optionSlug: "iso_vr_not_included_std", packageSlug: "luxury", priceDelta: '-50.00', priceType: 'per_sqft' },
    { optionSlug: "iso_vr_not_included_prem", packageSlug: "luxury", priceDelta: '-50.00', priceType: 'per_sqft' },
    { optionSlug: "iso_vr_included_lux", packageSlug: "basic", priceDelta: '50.00', priceType: 'per_sqft' },
    { optionSlug: "iso_vr_included_lux", packageSlug: "standard", priceDelta: '50.00', priceType: 'per_sqft' },
    { optionSlug: "iso_vr_included_lux", packageSlug: "premium", priceDelta: '50.00', priceType: 'per_sqft' },
    // ── Item #10: Kitchen Wall Tiles & Kitchen Countertop ──
    { optionSlug: "kitchen_tiles_slab_basic", packageSlug: "standard", priceDelta: '-12.00', priceType: 'per_sqft' },
    { optionSlug: "kitchen_tiles_slab_basic", packageSlug: "premium", priceDelta: '-30.00', priceType: 'per_sqft' },
    { optionSlug: "kitchen_tiles_slab_basic", packageSlug: "luxury", priceDelta: '-48.00', priceType: 'per_sqft' },
    { optionSlug: "kitchen_tiles_slab_std", packageSlug: "basic", priceDelta: '12.00', priceType: 'per_sqft' },
    { optionSlug: "kitchen_tiles_slab_std", packageSlug: "premium", priceDelta: '-18.00', priceType: 'per_sqft' },
    { optionSlug: "kitchen_tiles_slab_std", packageSlug: "luxury", priceDelta: '-36.00', priceType: 'per_sqft' },
    { optionSlug: "kitchen_tiles_slab_prem", packageSlug: "basic", priceDelta: '30.00', priceType: 'per_sqft' },
    { optionSlug: "kitchen_tiles_slab_prem", packageSlug: "standard", priceDelta: '18.00', priceType: 'per_sqft' },
    { optionSlug: "kitchen_tiles_slab_prem", packageSlug: "luxury", priceDelta: '-18.00', priceType: 'per_sqft' },
    { optionSlug: "kitchen_tiles_slab_lux", packageSlug: "basic", priceDelta: '48.00', priceType: 'per_sqft' },
    { optionSlug: "kitchen_tiles_slab_lux", packageSlug: "standard", priceDelta: '36.00', priceType: 'per_sqft' },
    { optionSlug: "kitchen_tiles_slab_lux", packageSlug: "premium", priceDelta: '18.00', priceType: 'per_sqft' },
    // ── Item #11: Wall Tiles ──
    { optionSlug: "wall_tiles_7ft_basic", packageSlug: "standard", priceDelta: '-14.00', priceType: 'per_sqft' },
    { optionSlug: "wall_tiles_7ft_basic", packageSlug: "premium", priceDelta: '-59.00', priceType: 'per_sqft' },
    { optionSlug: "wall_tiles_7ft_basic", packageSlug: "luxury", priceDelta: '-104.00', priceType: 'per_sqft' },
    { optionSlug: "wall_tiles_7ft_std", packageSlug: "basic", priceDelta: '14.00', priceType: 'per_sqft' },
    { optionSlug: "wall_tiles_7ft_std", packageSlug: "premium", priceDelta: '-45.00', priceType: 'per_sqft' },
    { optionSlug: "wall_tiles_7ft_std", packageSlug: "luxury", priceDelta: '-90.00', priceType: 'per_sqft' },
    { optionSlug: "wall_tiles_10ft_prem", packageSlug: "basic", priceDelta: '59.00', priceType: 'per_sqft' },
    { optionSlug: "wall_tiles_10ft_prem", packageSlug: "standard", priceDelta: '45.00', priceType: 'per_sqft' },
    { optionSlug: "wall_tiles_10ft_prem", packageSlug: "luxury", priceDelta: '-45.00', priceType: 'per_sqft' },
    { optionSlug: "wall_tiles_11ft_lux", packageSlug: "basic", priceDelta: '104.00', priceType: 'per_sqft' },
    { optionSlug: "wall_tiles_11ft_lux", packageSlug: "standard", priceDelta: '90.00', priceType: 'per_sqft' },
    { optionSlug: "wall_tiles_11ft_lux", packageSlug: "premium", priceDelta: '45.00', priceType: 'per_sqft' },
    // ── Item #12: Sanitary & CP Fittings ──
    { optionSlug: "sanitary_any_isi", packageSlug: "standard", priceDelta: '-20.00', priceType: 'per_sqft' },
    { optionSlug: "sanitary_any_isi", packageSlug: "premium", priceDelta: '-50.00', priceType: 'per_sqft' },
    { optionSlug: "sanitary_any_isi", packageSlug: "luxury", priceDelta: '-95.00', priceType: 'per_sqft' },
    { optionSlug: "sanitary_parryware", packageSlug: "basic", priceDelta: '20.00', priceType: 'per_sqft' },
    { optionSlug: "sanitary_parryware", packageSlug: "premium", priceDelta: '-30.00', priceType: 'per_sqft' },
    { optionSlug: "sanitary_parryware", packageSlug: "luxury", priceDelta: '-75.00', priceType: 'per_sqft' },
    { optionSlug: "sanitary_jaquar", packageSlug: "basic", priceDelta: '50.00', priceType: 'per_sqft' },
    { optionSlug: "sanitary_jaquar", packageSlug: "standard", priceDelta: '30.00', priceType: 'per_sqft' },
    { optionSlug: "sanitary_jaquar", packageSlug: "luxury", priceDelta: '-45.00', priceType: 'per_sqft' },
    { optionSlug: "sanitary_toto_kohler", packageSlug: "basic", priceDelta: '95.00', priceType: 'per_sqft' },
    { optionSlug: "sanitary_toto_kohler", packageSlug: "standard", priceDelta: '75.00', priceType: 'per_sqft' },
    { optionSlug: "sanitary_toto_kohler", packageSlug: "premium", priceDelta: '45.00', priceType: 'per_sqft' },
    // ── Item #13: PVC and CPVC Pipes ──
    { optionSlug: "pipes_any_isi", packageSlug: "standard", priceDelta: '-25.00', priceType: 'per_sqft' },
    { optionSlug: "pipes_any_isi", packageSlug: "premium", priceDelta: '-45.00', priceType: 'per_sqft' },
    { optionSlug: "pipes_any_isi", packageSlug: "luxury", priceDelta: '-60.00', priceType: 'per_sqft' },
    { optionSlug: "pipes_watertec", packageSlug: "basic", priceDelta: '25.00', priceType: 'per_sqft' },
    { optionSlug: "pipes_watertec", packageSlug: "premium", priceDelta: '-20.00', priceType: 'per_sqft' },
    { optionSlug: "pipes_watertec", packageSlug: "luxury", priceDelta: '-35.00', priceType: 'per_sqft' },
    { optionSlug: "pipes_kavery_ashirwad", packageSlug: "basic", priceDelta: '45.00', priceType: 'per_sqft' },
    { optionSlug: "pipes_kavery_ashirwad", packageSlug: "standard", priceDelta: '20.00', priceType: 'per_sqft' },
    { optionSlug: "pipes_kavery_ashirwad", packageSlug: "luxury", priceDelta: '-15.00', priceType: 'per_sqft' },
    { optionSlug: "pipes_finolex_supreme", packageSlug: "basic", priceDelta: '60.00', priceType: 'per_sqft' },
    { optionSlug: "pipes_finolex_supreme", packageSlug: "standard", priceDelta: '35.00', priceType: 'per_sqft' },
    { optionSlug: "pipes_finolex_supreme", packageSlug: "premium", priceDelta: '15.00', priceType: 'per_sqft' },
    // ── Item #14: Main Flooring, Balcony Tiles ──
    { optionSlug: "flooring_tiles_basic", packageSlug: "standard", priceDelta: '-10.00', priceType: 'per_sqft' },
    { optionSlug: "flooring_tiles_basic", packageSlug: "premium", priceDelta: '-30.00', priceType: 'per_sqft' },
    { optionSlug: "flooring_tiles_basic", packageSlug: "luxury", priceDelta: '-60.00', priceType: 'per_sqft' },
    { optionSlug: "flooring_tiles_std", packageSlug: "basic", priceDelta: '10.00', priceType: 'per_sqft' },
    { optionSlug: "flooring_tiles_std", packageSlug: "premium", priceDelta: '-20.00', priceType: 'per_sqft' },
    { optionSlug: "flooring_tiles_std", packageSlug: "luxury", priceDelta: '-50.00', priceType: 'per_sqft' },
    { optionSlug: "flooring_tiles_prem", packageSlug: "basic", priceDelta: '30.00', priceType: 'per_sqft' },
    { optionSlug: "flooring_tiles_prem", packageSlug: "standard", priceDelta: '20.00', priceType: 'per_sqft' },
    { optionSlug: "flooring_tiles_prem", packageSlug: "luxury", priceDelta: '-30.00', priceType: 'per_sqft' },
    { optionSlug: "flooring_tiles_lux", packageSlug: "basic", priceDelta: '60.00', priceType: 'per_sqft' },
    { optionSlug: "flooring_tiles_lux", packageSlug: "standard", priceDelta: '50.00', priceType: 'per_sqft' },
    { optionSlug: "flooring_tiles_lux", packageSlug: "premium", priceDelta: '30.00', priceType: 'per_sqft' },
    // ── Item #15: Staircase ──
    { optionSlug: "staircase_tiles_basic", packageSlug: "standard", priceDelta: '-15.00', priceType: 'per_sqft' },
    { optionSlug: "staircase_tiles_basic", packageSlug: "premium", priceDelta: '-85.00', priceType: 'per_sqft' },
    { optionSlug: "staircase_tiles_basic", packageSlug: "luxury", priceDelta: '-125.00', priceType: 'per_sqft' },
    { optionSlug: "staircase_tiles_std", packageSlug: "basic", priceDelta: '15.00', priceType: 'per_sqft' },
    { optionSlug: "staircase_tiles_std", packageSlug: "premium", priceDelta: '-70.00', priceType: 'per_sqft' },
    { optionSlug: "staircase_tiles_std", packageSlug: "luxury", priceDelta: '-110.00', priceType: 'per_sqft' },
    { optionSlug: "staircase_granite_prem", packageSlug: "basic", priceDelta: '85.00', priceType: 'per_sqft' },
    { optionSlug: "staircase_granite_prem", packageSlug: "standard", priceDelta: '70.00', priceType: 'per_sqft' },
    { optionSlug: "staircase_granite_prem", packageSlug: "luxury", priceDelta: '-40.00', priceType: 'per_sqft' },
    { optionSlug: "staircase_granite_lux", packageSlug: "basic", priceDelta: '125.00', priceType: 'per_sqft' },
    { optionSlug: "staircase_granite_lux", packageSlug: "standard", priceDelta: '110.00', priceType: 'per_sqft' },
    { optionSlug: "staircase_granite_lux", packageSlug: "premium", priceDelta: '40.00', priceType: 'per_sqft' },
    // ── Item #16: Parking ──
    { optionSlug: "parking_tiles_basic", packageSlug: "standard", priceDelta: '-5.00', priceType: 'per_sqft' },
    { optionSlug: "parking_tiles_basic", packageSlug: "premium", priceDelta: '-25.00', priceType: 'per_sqft' },
    { optionSlug: "parking_tiles_basic", packageSlug: "luxury", priceDelta: '-55.00', priceType: 'per_sqft' },
    { optionSlug: "parking_tiles_std", packageSlug: "basic", priceDelta: '5.00', priceType: 'per_sqft' },
    { optionSlug: "parking_tiles_std", packageSlug: "premium", priceDelta: '-20.00', priceType: 'per_sqft' },
    { optionSlug: "parking_tiles_std", packageSlug: "luxury", priceDelta: '-50.00', priceType: 'per_sqft' },
    { optionSlug: "parking_tiles_prem", packageSlug: "basic", priceDelta: '25.00', priceType: 'per_sqft' },
    { optionSlug: "parking_tiles_prem", packageSlug: "standard", priceDelta: '20.00', priceType: 'per_sqft' },
    { optionSlug: "parking_tiles_prem", packageSlug: "luxury", priceDelta: '-30.00', priceType: 'per_sqft' },
    { optionSlug: "parking_tiles_lux", packageSlug: "basic", priceDelta: '55.00', priceType: 'per_sqft' },
    { optionSlug: "parking_tiles_lux", packageSlug: "standard", priceDelta: '50.00', priceType: 'per_sqft' },
    { optionSlug: "parking_tiles_lux", packageSlug: "premium", priceDelta: '30.00', priceType: 'per_sqft' },
    // ── Item #17: Main Door & Internal Doors ──
    { optionSlug: "doors_basic", packageSlug: "standard", priceDelta: '-25.00', priceType: 'per_sqft' },
    { optionSlug: "doors_basic", packageSlug: "premium", priceDelta: '-125.00', priceType: 'per_sqft' },
    { optionSlug: "doors_basic", packageSlug: "luxury", priceDelta: '-200.00', priceType: 'per_sqft' },
    { optionSlug: "doors_std", packageSlug: "basic", priceDelta: '25.00', priceType: 'per_sqft' },
    { optionSlug: "doors_std", packageSlug: "premium", priceDelta: '-100.00', priceType: 'per_sqft' },
    { optionSlug: "doors_std", packageSlug: "luxury", priceDelta: '-175.00', priceType: 'per_sqft' },
    { optionSlug: "doors_prem", packageSlug: "basic", priceDelta: '125.00', priceType: 'per_sqft' },
    { optionSlug: "doors_prem", packageSlug: "standard", priceDelta: '100.00', priceType: 'per_sqft' },
    { optionSlug: "doors_prem", packageSlug: "luxury", priceDelta: '-75.00', priceType: 'per_sqft' },
    { optionSlug: "doors_lux", packageSlug: "basic", priceDelta: '200.00', priceType: 'per_sqft' },
    { optionSlug: "doors_lux", packageSlug: "standard", priceDelta: '175.00', priceType: 'per_sqft' },
    { optionSlug: "doors_lux", packageSlug: "premium", priceDelta: '75.00', priceType: 'per_sqft' },
    // ── Item #18: Balcony & Headroom Doors ──
    { optionSlug: "balcony_headroom_basic", packageSlug: "premium", priceDelta: '-39.00', priceType: 'per_sqft' },
    { optionSlug: "balcony_headroom_basic", packageSlug: "luxury", priceDelta: '-39.00', priceType: 'per_sqft' },
    { optionSlug: "balcony_headroom_std", packageSlug: "premium", priceDelta: '-39.00', priceType: 'per_sqft' },
    { optionSlug: "balcony_headroom_std", packageSlug: "luxury", priceDelta: '-39.00', priceType: 'per_sqft' },
    { optionSlug: "balcony_headroom_prem", packageSlug: "basic", priceDelta: '39.00', priceType: 'per_sqft' },
    { optionSlug: "balcony_headroom_prem", packageSlug: "standard", priceDelta: '39.00', priceType: 'per_sqft' },
    { optionSlug: "balcony_headroom_lux", packageSlug: "basic", priceDelta: '39.00', priceType: 'per_sqft' },
    { optionSlug: "balcony_headroom_lux", packageSlug: "standard", priceDelta: '39.00', priceType: 'per_sqft' },
    // ── Item #19: Bathroom Doors ──
    { optionSlug: "bathroom_doors_pvc", packageSlug: "standard", priceDelta: '-4.00', priceType: 'per_sqft' },
    { optionSlug: "bathroom_doors_pvc", packageSlug: "premium", priceDelta: '-10.00', priceType: 'per_sqft' },
    { optionSlug: "bathroom_doors_pvc", packageSlug: "luxury", priceDelta: '-17.00', priceType: 'per_sqft' },
    { optionSlug: "bathroom_doors_wpc", packageSlug: "basic", priceDelta: '4.00', priceType: 'per_sqft' },
    { optionSlug: "bathroom_doors_wpc", packageSlug: "premium", priceDelta: '-6.00', priceType: 'per_sqft' },
    { optionSlug: "bathroom_doors_wpc", packageSlug: "luxury", priceDelta: '-13.00', priceType: 'per_sqft' },
    { optionSlug: "bathroom_doors_lam_wpc", packageSlug: "basic", priceDelta: '10.00', priceType: 'per_sqft' },
    { optionSlug: "bathroom_doors_lam_wpc", packageSlug: "standard", priceDelta: '6.00', priceType: 'per_sqft' },
    { optionSlug: "bathroom_doors_lam_wpc", packageSlug: "luxury", priceDelta: '-7.00', priceType: 'per_sqft' },
    { optionSlug: "bathroom_doors_frp", packageSlug: "basic", priceDelta: '17.00', priceType: 'per_sqft' },
    { optionSlug: "bathroom_doors_frp", packageSlug: "standard", priceDelta: '13.00', priceType: 'per_sqft' },
    { optionSlug: "bathroom_doors_frp", packageSlug: "premium", priceDelta: '7.00', priceType: 'per_sqft' },
    // ── Item #20: PAINTING ──
    { optionSlug: "paint_basic", packageSlug: "standard", priceDelta: '-25.00', priceType: 'per_sqft' },
    { optionSlug: "paint_basic", packageSlug: "premium", priceDelta: '-50.00', priceType: 'per_sqft' },
    { optionSlug: "paint_basic", packageSlug: "luxury", priceDelta: '-80.00', priceType: 'per_sqft' },
    { optionSlug: "paint_std", packageSlug: "basic", priceDelta: '25.00', priceType: 'per_sqft' },
    { optionSlug: "paint_std", packageSlug: "premium", priceDelta: '-25.00', priceType: 'per_sqft' },
    { optionSlug: "paint_std", packageSlug: "luxury", priceDelta: '-55.00', priceType: 'per_sqft' },
    { optionSlug: "paint_prem", packageSlug: "basic", priceDelta: '50.00', priceType: 'per_sqft' },
    { optionSlug: "paint_prem", packageSlug: "standard", priceDelta: '25.00', priceType: 'per_sqft' },
    { optionSlug: "paint_prem", packageSlug: "luxury", priceDelta: '-30.00', priceType: 'per_sqft' },
    { optionSlug: "paint_lux", packageSlug: "basic", priceDelta: '80.00', priceType: 'per_sqft' },
    { optionSlug: "paint_lux", packageSlug: "standard", priceDelta: '55.00', priceType: 'per_sqft' },
    { optionSlug: "paint_lux", packageSlug: "premium", priceDelta: '30.00', priceType: 'per_sqft' },
    // ── Item #21: Wires, Switches & Pipes ──
    { optionSlug: "elec_basic", packageSlug: "standard", priceDelta: '-30.00', priceType: 'per_sqft' },
    { optionSlug: "elec_basic", packageSlug: "premium", priceDelta: '-50.00', priceType: 'per_sqft' },
    { optionSlug: "elec_basic", packageSlug: "luxury", priceDelta: '-70.00', priceType: 'per_sqft' },
    { optionSlug: "elec_std", packageSlug: "basic", priceDelta: '30.00', priceType: 'per_sqft' },
    { optionSlug: "elec_std", packageSlug: "premium", priceDelta: '-20.00', priceType: 'per_sqft' },
    { optionSlug: "elec_std", packageSlug: "luxury", priceDelta: '-40.00', priceType: 'per_sqft' },
    { optionSlug: "elec_prem", packageSlug: "basic", priceDelta: '50.00', priceType: 'per_sqft' },
    { optionSlug: "elec_prem", packageSlug: "standard", priceDelta: '20.00', priceType: 'per_sqft' },
    { optionSlug: "elec_prem", packageSlug: "luxury", priceDelta: '-20.00', priceType: 'per_sqft' },
    { optionSlug: "elec_lux", packageSlug: "basic", priceDelta: '70.00', priceType: 'per_sqft' },
    { optionSlug: "elec_lux", packageSlug: "standard", priceDelta: '40.00', priceType: 'per_sqft' },
    { optionSlug: "elec_lux", packageSlug: "premium", priceDelta: '20.00', priceType: 'per_sqft' },
    // ── Item #22: Lights ──
    { optionSlug: "lights_any_isi", packageSlug: "standard", priceDelta: '-5.00', priceType: 'per_sqft' },
    { optionSlug: "lights_any_isi", packageSlug: "premium", priceDelta: '-11.00', priceType: 'per_sqft' },
    { optionSlug: "lights_any_isi", packageSlug: "luxury", priceDelta: '-11.00', priceType: 'per_sqft' },
    { optionSlug: "lights_luker", packageSlug: "basic", priceDelta: '5.00', priceType: 'per_sqft' },
    { optionSlug: "lights_luker", packageSlug: "premium", priceDelta: '-6.00', priceType: 'per_sqft' },
    { optionSlug: "lights_luker", packageSlug: "luxury", priceDelta: '-6.00', priceType: 'per_sqft' },
    { optionSlug: "lights_philips", packageSlug: "basic", priceDelta: '11.00', priceType: 'per_sqft' },
    { optionSlug: "lights_philips", packageSlug: "standard", priceDelta: '6.00', priceType: 'per_sqft' },
    { optionSlug: "lights_philips_lux", packageSlug: "basic", priceDelta: '11.00', priceType: 'per_sqft' },
    { optionSlug: "lights_philips_lux", packageSlug: "standard", priceDelta: '6.00', priceType: 'per_sqft' },
    // ── Item #23: Staircase and Balcony Railings ──
    { optionSlug: "railings_ms_basic", packageSlug: "premium", priceDelta: '-10.00', priceType: 'per_sqft' },
    { optionSlug: "railings_ms_basic", packageSlug: "luxury", priceDelta: '-35.00', priceType: 'per_sqft' },
    { optionSlug: "railings_ms_std", packageSlug: "premium", priceDelta: '-10.00', priceType: 'per_sqft' },
    { optionSlug: "railings_ms_std", packageSlug: "luxury", priceDelta: '-35.00', priceType: 'per_sqft' },
    { optionSlug: "railings_ss_prem", packageSlug: "basic", priceDelta: '10.00', priceType: 'per_sqft' },
    { optionSlug: "railings_ss_prem", packageSlug: "standard", priceDelta: '10.00', priceType: 'per_sqft' },
    { optionSlug: "railings_ss_prem", packageSlug: "luxury", priceDelta: '-25.00', priceType: 'per_sqft' },
    { optionSlug: "railings_glass_lux", packageSlug: "basic", priceDelta: '35.00', priceType: 'per_sqft' },
    { optionSlug: "railings_glass_lux", packageSlug: "standard", priceDelta: '35.00', priceType: 'per_sqft' },
    { optionSlug: "railings_glass_lux", packageSlug: "premium", priceDelta: '25.00', priceType: 'per_sqft' },
    // ── Item #24: Parapet Wall (if headroom is built) ──
    { optionSlug: "parapet_3ft_4_5in_basic", packageSlug: "premium", priceDelta: '-40.00', priceType: 'per_sqft' },
    { optionSlug: "parapet_3ft_4_5in_basic", packageSlug: "luxury", priceDelta: '-55.00', priceType: 'per_sqft' },
    { optionSlug: "parapet_3ft_4_5in_std", packageSlug: "premium", priceDelta: '-40.00', priceType: 'per_sqft' },
    { optionSlug: "parapet_3ft_4_5in_std", packageSlug: "luxury", priceDelta: '-55.00', priceType: 'per_sqft' },
    { optionSlug: "parapet_3ft_9in_prem", packageSlug: "basic", priceDelta: '40.00', priceType: 'per_sqft' },
    { optionSlug: "parapet_3ft_9in_prem", packageSlug: "standard", priceDelta: '40.00', priceType: 'per_sqft' },
    { optionSlug: "parapet_3ft_9in_prem", packageSlug: "luxury", priceDelta: '-15.00', priceType: 'per_sqft' },
    { optionSlug: "parapet_3_5ft_9in_lux", packageSlug: "basic", priceDelta: '55.00', priceType: 'per_sqft' },
    { optionSlug: "parapet_3_5ft_9in_lux", packageSlug: "standard", priceDelta: '55.00', priceType: 'per_sqft' },
    { optionSlug: "parapet_3_5ft_9in_lux", packageSlug: "premium", priceDelta: '15.00', priceType: 'per_sqft' },
  ];

  const existingOPs = await db.select().from(optionPrices);
  for (const d of opDefs) {
    const optId = optIdBySlug[d.optionSlug];
    const pId = pkgIds[d.packageSlug];
    if (!optId || !pId) continue;

    const deltaVal = Math.max(0, parseFloat(d.priceDelta) || 0).toFixed(2);
    const existing = existingOPs.find(ex => ex.optionId === optId && ex.packageId === pId);
    if (existing) {
      await db.update(optionPrices).set({
        priceDelta: deltaVal,
        priceType: d.priceType,
      }).where(eq(optionPrices.id, existing.id));
    } else {
      await db.insert(optionPrices).values({
        optionId: optId,
        packageId: pId,
        priceDelta: deltaVal,
        priceType: d.priceType,
      });
    }
  }
  log('Option Prices (Upgrade Deltas)', opDefs.length);
}

// ---------------------------------------------------------------------------
// 5. ADD-ONS + ADD-ON PRICES
// ---------------------------------------------------------------------------

async function seedAddons() {
  const addonDefs = [
    {
      slug: 'overhead_concrete_tank',
      name: 'Overhead Concrete Tank',
      description: 'Custom capacity overhead water storage tank. Capacity selected in Litres. Note: OHT Capacity Recommendation: 2,500 Litres for a Family of 4',
      pricingUnit: 'per_litre',
      defaultQuantity: '2500',
      minQuantity: '500',
      maxQuantity: '10000',
      sortOrder: 1,
    },
    {
      slug: 'conventional_septic_tank',
      name: 'Conventional Septic Tank',
      description: 'Volume-based septic tank. Capacity selected in Litres. Note: Septic Tank Capacity Recommendation: 6,000 Litres for a Family of 4',
      pricingUnit: 'per_litre',
      defaultQuantity: '6000',
      minQuantity: '1000',
      maxQuantity: '15000',
      sortOrder: 2,
    },
    {
      slug: 'underground_sump',
      name: 'Underground Sump',
      description: 'Underground water sump. Capacity selected in Litres. Note: UG Sump Capacity Recommendation: 6,000 Litres for a Family of 4',
      pricingUnit: 'per_litre',
      defaultQuantity: '6000',
      minQuantity: '1000',
      maxQuantity: '20000',
      sortOrder: 3,
    },
    {
      slug: 'compound_wall',
      name: 'Compound Wall (up to 5\'6" Height)',
      description: 'Perimeter compound wall. Running feet entered by customer.',
      pricingUnit: 'per_rft',
      defaultQuantity: '50',
      minQuantity: '10',
      maxQuantity: '500',
      sortOrder: 4,
    },
    {
      slug: 'rooftop_solar',
      name: 'Rooftop Solar Panels',
      description: 'Grid-tied rooftop solar system. Pricing before subsidy reduction. Note: 3kW per day required for 1 to 3 BHK',
      pricingUnit: 'fixed',
      sortOrder: 5,
    },
    {
      slug: 'main_gate',
      name: 'Main Gate',
      description: 'Main entrance gate. Price per sq.ft of gate area. Note: Recommended gate area for 1 car parking = 60 sq.ft., 2 car parking = 120 sq.ft, Wicket gate = 24 sq.ft.',
      pricingUnit: 'per_sqft_gate',
      defaultQuantity: '60',
      minQuantity: '20',
      maxQuantity: '200',
      sortOrder: 6,
    },
    {
      slug: 'cctv_security',
      name: 'CCTV & Security System',
      description: 'Complete CCTV setup with DVR and color night vision cameras.',
      pricingUnit: 'fixed',
      sortOrder: 7,
    },
    {
      slug: 'smart_home',
      name: 'Smart Home Automation',
      description: 'Smart switches, lights, fans & main door lock automation.',
      pricingUnit: 'fixed',
      sortOrder: 8,
    },
    {
      slug: 'passenger_lift',
      name: 'Passenger Lift (4 Pax)',
      description: 'Complete 4-passenger lift installation.',
      pricingUnit: 'fixed',
      sortOrder: 9,
    },
    {
      slug: 'choke_pit',
      name: 'Choke Pit & Rings',
      description: 'Choke pit installation for drainage and greywater.',
      pricingUnit: 'fixed',
      sortOrder: 10,
    },
    {
      slug: 'water_heat_pump',
      name: 'Water Heat Pump / Solar Water Heater',
      description: 'Water heating solution for the home. Note: 200 to 250 Litres per day required for family of 5',
      pricingUnit: 'fixed',
      sortOrder: 11,
    },
    {
      slug: 'cool_roof_tiles',
      name: 'Cool Roof Tiles',
      description: "1' x 1' white tiles with epoxy waterproofing. Price per sq.ft of terrace area.",
      pricingUnit: 'per_sqft_terrace',
      defaultQuantity: '100',
      minQuantity: '50',
      maxQuantity: '2000',
      sortOrder: 12,
    },
    {
      slug: 'motor_automation',
      name: 'Motor Automation (Auto Cut-Off)',
      description: 'Automatic water controller with auto cut-off for overhead tank.',
      pricingUnit: 'fixed',
      sortOrder: 13,
    },
    {
      slug: 'pressure_pump',
      name: 'Pressure Pump (Grundfos)',
      description: 'Grundfos booster pressure pump system for domestic water supply.',
      pricingUnit: 'fixed',
      sortOrder: 14,
    },
    {
      slug: 'water_softener',
      name: 'Water Softener (AO Smith)',
      description: 'AO Smith water softener system suitable for TDS below 1000.',
      pricingUnit: 'fixed',
      sortOrder: 15,
    },
  ];

  for (const a of addonDefs) {
    await db.insert(addons).values(a).onConflictDoUpdate({
      target: addons.slug,
      set: {
        name: a.name,
        description: a.description,
        pricingUnit: a.pricingUnit,
        defaultQuantity: a.defaultQuantity,
        minQuantity: a.minQuantity,
        maxQuantity: a.maxQuantity,
        sortOrder: a.sortOrder,
      },
    });
  }
  log('Add-Ons (15 Items)', addonDefs.length);

  // Fetch addon IDs
  const addonRows = await db.select().from(addons);
  const addonIdBySlug: Record<string, number> = {};
  for (const r of addonRows) addonIdBySlug[r.slug] = r.id;

  // Add-on prices — source: Construction Packages_v4 Packages.html
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
    // 5. Rooftop Solar: ₹1,90,000 (3kW), ₹2,95,000 (5kW)
    { addonSlug: 'rooftop_solar', variantName: '3 kW System', variantSlug: '3kw', packageTier: 'all', price: '190000.00' },
    { addonSlug: 'rooftop_solar', variantName: '5 kW System', variantSlug: '5kw', packageTier: 'all', price: '295000.00' },
    // 6. Main Gate: ₹620/sqft (MS), ₹1250/sqft (SS), ₹1300/sqft (MS Auto), ₹2000/sqft (SS Auto)
    { addonSlug: 'main_gate', variantName: 'MS Gate',                         variantSlug: 'ms_gate',      packageTier: 'all', price: '620.00' },
    { addonSlug: 'main_gate', variantName: 'Stainless Steel Gate',            variantSlug: 'ss_gate',      packageTier: 'all', price: '1250.00' },
    { addonSlug: 'main_gate', variantName: 'MS Gate with Automation',         variantSlug: 'ms_auto_gate', packageTier: 'all', price: '1300.00' },
    { addonSlug: 'main_gate', variantName: 'SS Gate with Automation',         variantSlug: 'ss_auto_gate', packageTier: 'all', price: '2000.00' },
    // 7. CCTV: ₹37,000 (4×2MP), ₹45,000 (4×5MP)
    { addonSlug: 'cctv_security', variantName: '4 Camera 2MP Color AHD', variantSlug: '4cam_2mp', packageTier: 'all', price: '37000.00' },
    { addonSlug: 'cctv_security', variantName: '4 Camera 5MP Color AHD', variantSlug: '4cam_5mp', packageTier: 'all', price: '45000.00' },
    // 8. Smart Home: ₹2,80,000 (Switches, Lights, Fans, Door Lock)
    { addonSlug: 'smart_home', variantName: 'Standard Package', variantSlug: 'standard', packageTier: 'all', price: '280000.00' },
    // 9. Passenger Lift: ₹12,50,000
    { addonSlug: 'passenger_lift', variantName: '4-Passenger Lift', variantSlug: '4pax', packageTier: 'all', price: '1250000.00' },
    // 10. Choke Pit: ₹15,000
    { addonSlug: 'choke_pit', variantName: '1 Choke Pit',  variantSlug: '1pit',  packageTier: 'all', price: '15000.00' },
    { addonSlug: 'choke_pit', variantName: '2 Choke Pits', variantSlug: '2pits', packageTier: 'all', price: '15000.00' },
    // 11. Water Heat Pump / Solar Water Heater: Solar 125L (₹50k), Solar 250L (₹100k), Electric (₹176k)
    { addonSlug: 'water_heat_pump', variantName: 'Solar 125 L Capacity', variantSlug: 'solar_125l', packageTier: 'all', price: '50000.00' },
    { addonSlug: 'water_heat_pump', variantName: 'Solar 250 L Capacity', variantSlug: 'solar_250l', packageTier: 'all', price: '100000.00' },
    { addonSlug: 'water_heat_pump', variantName: 'Electric AO Smith HPI 40 (24h Supply)', variantSlug: 'electric_ao_smith', packageTier: 'all', price: '176000.00' },
    // 12. Cool Roof Tiles: ₹170/sqft
    { addonSlug: 'cool_roof_tiles', variantName: '1\'x1\' White with Epoxy', variantSlug: 'white_epoxy', packageTier: 'all', price: '170.00' },
    // 13. Motor Automation: ₹12,000 (bore), ₹12,000 (corporation), ₹24,000 (both)
    { addonSlug: 'motor_automation', variantName: 'Bore Water OHT',                            variantSlug: 'bore',        packageTier: 'all', price: '12000.00' },
    { addonSlug: 'motor_automation', variantName: 'Corporation Water OHT',                     variantSlug: 'corporation', packageTier: 'all', price: '12000.00' },
    { addonSlug: 'motor_automation', variantName: 'Both (Bore & Corporation Water OHT)',       variantSlug: 'both',        packageTier: 'all', price: '24000.00' },
    // 14. Pressure Pump: ₹57,500 / ₹71,000 / ₹82,800 / ₹1,07,000
    { addonSlug: 'pressure_pump', variantName: '3 Bathrooms (without body shower)',            variantSlug: '3bath_no_body',       packageTier: 'all', price: '57500.00' },
    { addonSlug: 'pressure_pump', variantName: '4+ Bathrooms (without body shower)',           variantSlug: '4plus_bath_no_body',  packageTier: 'all', price: '71000.00' },
    { addonSlug: 'pressure_pump', variantName: '1 Bath with Body Shower + 2 Baths without',    variantSlug: '1body_2no_body',      packageTier: 'all', price: '82800.00' },
    { addonSlug: 'pressure_pump', variantName: '3 Bathrooms (with body shower)',               variantSlug: '3bath_body',          packageTier: 'all', price: '107000.00' },
    // 15. Water Softener: ₹1,05,000
    { addonSlug: 'water_softener', variantName: 'AO Smith (TDS below 1000)',                   variantSlug: 'ao_smith_tds1000',    packageTier: 'all', price: '105000.00' },
  ];

  const existingAPs = await db.select().from(addonPrices);
  for (const d of addonPriceDefs) {
    const aId = addonIdBySlug[d.addonSlug];
    if (!aId) continue;

    const existing = existingAPs.find(ex => ex.addonId === aId && ex.variantSlug === d.variantSlug && ex.packageTier === d.packageTier);
    if (existing) {
      await db.update(addonPrices).set({
        variantName: d.variantName,
        price: d.price,
      }).where(eq(addonPrices.id, existing.id));
    } else {
      await db.insert(addonPrices).values({
        addonId: aId,
        variantName: d.variantName,
        variantSlug: d.variantSlug,
        packageTier: d.packageTier,
        price: d.price,
      });
    }
  }
  log('Add-On Prices', addonPriceDefs.length);
}

// ---------------------------------------------------------------------------
// 6. DEFAULT ADMIN USER
// ---------------------------------------------------------------------------

async function seedAdminUser() {
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
}

// ---------------------------------------------------------------------------
// 7. MILESTONE STAGES (10 Standard Phases)
// ---------------------------------------------------------------------------

async function seedMilestones() {
  const data = [
    { stageNumber: 1, stageName: 'Design & Approvals', percentage: '3.00', keyDeliverables: 'Soil test, floor plan, structural drawing, DTCP approval assistance' },
    { stageNumber: 2, stageName: 'Earthwork & Excavation', percentage: '4.00', keyDeliverables: 'Foundation trenching, site leveling, anti-termite treatment' },
    { stageNumber: 3, stageName: 'Foundation & Plinth', percentage: '15.00', keyDeliverables: 'Footing concrete, plinth beam, basement filling, PCC/RCC basement' },
    { stageNumber: 4, stageName: 'RCC Structure (Columns & Slabs)', percentage: '22.00', keyDeliverables: 'Column casting, roof slab shuttering, beam reinforcement & curing' },
    { stageNumber: 5, stageName: 'Brickwork & Masonry', percentage: '14.00', keyDeliverables: 'External & internal walls, lintels, parapet wall construction' },
    { stageNumber: 6, stageName: 'Electrical & Plumbing Concealing', percentage: '8.00', keyDeliverables: 'Conduits, plumbing lines, switch boxes, drainage routing' },
    { stageNumber: 7, stageName: 'Plastering (Internal & External)', percentage: '10.00', keyDeliverables: 'Ceiling plastering, wall leveling, exterior weather-coat plaster' },
    { stageNumber: 8, stageName: 'Flooring & Wall Tiling', percentage: '11.00', keyDeliverables: 'Main vitrified tiles, bathroom tiling, kitchen granite countertop' },
    { stageNumber: 9, stageName: 'Painting & Woodwork', percentage: '8.00', keyDeliverables: 'Putty, primer, emulsion coats, main door & internal door fixing' },
    { stageNumber: 10, stageName: 'Fixtures, Finishing & Handover', percentage: '5.00', keyDeliverables: 'CP & sanitary fittings, switches, lights, glass railings, deep clean' },
  ];

  for (const m of data) {
    await db.insert(milestoneStages).values(m).onConflictDoUpdate({
      target: milestoneStages.stageNumber,
      set: {
        stageName: m.stageName,
        percentage: m.percentage,
        keyDeliverables: m.keyDeliverables,
      },
    });
  }
  log('Milestone Stages (10 Phases)', data.length);
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------

async function main() {
  console.log('\n🌱 ASTHIWAR Master Data Seed — Phase 3 (v4/v5 Specs)\n');
  console.log('----------------------------------------');

  try {
    console.log('\n📍 Seeding Locations...');
    await seedLocations();

    console.log('\n📦 Seeding Packages & Prices...');
    const pkgIds = await seedPackages();

    console.log('\n🗂️  Seeding Categories...');
    const catIds = await seedCategories();

    console.log('\n🔩 Seeding Specifications (24 Items → Options → Package Mappings → Prices)...');
    await seedSpecifications(pkgIds, catIds);

    console.log('\n🔌 Seeding Add-Ons & Prices...');
    await seedAddons();

    console.log('\n🏗️  Seeding Milestone Stages...');
    await seedMilestones();

    console.log('\n🔐 Seeding Admin User...');
    await seedAdminUser();

    console.log('\n----------------------------------------');
    console.log('✅ Master data successfully synchronized with v4/v5 packages on Neon PostgreSQL.\n');
  } catch (err) {
    console.error('\n❌ Seed failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();

'use client';

// Rule #5: no money is computed here. All figures come from the backend.

import React, { useState, useEffect, useMemo } from 'react';
import {
  Check,
  ArrowRight,
  ArrowLeft,
  Star,
  Home,
  Shield,
  Gem,
  Crown,
  BrickWall,
  PaintRoller,
  AppWindow,
  Bug,
  Cable,
  ToggleLeft,
  DoorOpen,
  Ruler,
  ArrowDownToLine,
  Building2,
  FlaskConical,
  Compass,
  HardHat,
  Box,
  ShieldCheck,
  Award,
  Handshake,
  Columns,
  LayoutGrid,
  Layers,
  Sparkles,
  Bath,
  Pipette,
  Grid3X3,
  Lamp,
  Fence,
} from 'lucide-react';
import type {
  CalculationResult,
  EstimateFormState,
  PackageItem,
  PackageSlug,
  ComparisonMatrixItem,
} from '@/lib/calculator/types';
import { getComparisonMatrix } from '@/lib/api/calculator';

interface StepPackagesProps {
  formData: EstimateFormState;
  packages: PackageItem[];
  previewResult?: CalculationResult | null;
  onChange: (fields: Partial<EstimateFormState>) => void;
  onNext: () => void;
  onBack: () => void;
}

const PACKAGE_HIGHLIGHTS: Record<string, string[]> = {
  basic: [
    'ISI Fe 550D TMT Steel & ISI Cement',
    'Solid Concrete Blocks Masonry',
    '1 Putty + 1 Primer + 2 ISI Emulsion Paint',
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

/* Authoritative 24 items directly from database/src/seeds/seed.ts */
const DB_FALLBACK_MATRIX: ComparisonMatrixItem[] = [
  {
    id: 1,
    slug: 'steel_rebar_binding_wires',
    name: 'Steel Rebar Fe 550D & Binding Wires',
    category: 'Structure & Civil',
    categorySlug: 'structure',
    basic: 'Any ISI Brand Steel & Wire',
    standard: 'SPA / Vizag Steel & TATA Wire',
    premium: 'ARS / Suryadev / Sumangala & TATA Wire',
    luxury: 'JSW / TATA Steel & TATA Wire',
  },
  {
    id: 2,
    slug: 'cement',
    name: 'Cement',
    category: 'Structure & Civil',
    categorySlug: 'structure',
    basic: 'Any ISI Brand Cement',
    standard: 'JSW Cement',
    premium: 'Ramco / Dalmia Cement',
    luxury: 'Ultratech / Chettinad Cement',
  },
  {
    id: 3,
    slug: 'masonry_work',
    name: 'Masonry Work',
    category: 'Structure & Civil',
    categorySlug: 'structure',
    basic: 'Solid Concrete Blocks',
    standard: 'Fly Ash / AAC Blocks',
    premium: 'Fly Ash / AAC Blocks (Premium)',
    luxury: '100% First-Class Red Bricks',
  },
  {
    id: 4,
    slug: 'basement_height',
    name: 'Basement Height (from ground level)',
    category: 'Structure & Civil',
    categorySlug: 'structure',
    basic: 'Fly Ash Bricks upto 3 ft',
    standard: 'Fly Ash Bricks upto 3 ft (Std)',
    premium: 'Fly Ash Bricks upto 4 ft',
    luxury: 'Fly Ash / Red Bricks upto 4.5 ft',
  },
  {
    id: 5,
    slug: 'ceiling_height',
    name: 'Ceiling Height',
    category: 'Structure & Civil',
    categorySlug: 'structure',
    basic: '9.5 ft Ceiling Height',
    standard: '10 ft Ceiling Height',
    premium: '10 ft Ceiling Height',
    luxury: '11 ft Ceiling Height',
  },
  {
    id: 6,
    slug: 'waterproofing_basement_pcc',
    name: 'Water Proofing & Basement PCC',
    category: 'Structure & Civil',
    categorySlug: 'structure',
    basic: 'Basic PCC (Waterproofing add-on)',
    standard: 'PCC + Dr.Fixit/Fosroc/Bostik Waterproofing',
    premium: 'PCC + Dr.Fixit/Fosroc/Bostik Waterproofing',
    luxury: 'RCC Basement + Dr.Fixit/Fosroc Waterproofing',
  },
  {
    id: 7,
    slug: 'soil_testing',
    name: 'Soil Testing',
    category: 'Design & Engineering',
    categorySlug: 'design',
    basic: '—',
    standard: '—',
    premium: 'Included',
    luxury: 'Included',
  },
  {
    id: 8,
    slug: 'electrical_plumbing_drawings',
    name: 'Electrical & Plumbing Drawings (MEP)',
    category: 'Design & Engineering',
    categorySlug: 'design',
    basic: '—',
    standard: '—',
    premium: 'Included',
    luxury: 'Included',
  },
  {
    id: 9,
    slug: 'isometric_vr',
    name: 'Isometric Views & Virtual Reality',
    category: 'Design & Engineering',
    categorySlug: 'design',
    basic: '—',
    standard: '—',
    premium: '—',
    luxury: '3D VR Walkthrough Included',
  },
  {
    id: 10,
    slug: 'kitchen_wall_tiles_countertop',
    name: 'Kitchen Wall Tiles & Countertop',
    category: 'Kitchen & Plumbing',
    categorySlug: 'kitchen',
    basic: '2.5 ft Tiles + Granite Slab (15 rft)',
    standard: '4 ft Tiles + Granite Slab (15 rft)',
    premium: 'Roof Height Tiles + Granite Slab (20 rft)',
    luxury: 'Roof Height Tiles + Premium Granite (25 rft)',
  },
  {
    id: 11,
    slug: 'wall_tiles',
    name: 'Bathroom Wall Tiles',
    category: 'Bathroom & Sanitary',
    categorySlug: 'bathroom',
    basic: '7 ft coverage (Rs. 35/sq.ft)',
    standard: '7 ft coverage (Rs. 45/sq.ft)',
    premium: '10 ft coverage (Rs. 55/sq.ft)',
    luxury: '11 ft coverage (Rs. 75/sq.ft)',
  },
  {
    id: 12,
    slug: 'sanitary_cp_fittings',
    name: 'Sanitary & CP Fittings',
    category: 'Bathroom & Sanitary',
    categorySlug: 'bathroom',
    basic: 'Any ISI Brand Sanitary & CP',
    standard: 'Parryware (Rs. 20,000/bath)',
    premium: 'Jaquar (Rs. 30,000/bath)',
    luxury: 'Toto / Kohler (Rs. 45,000/bath)',
  },
  {
    id: 13,
    slug: 'pvc_cpvc_pipes',
    name: 'PVC & CPVC Pipes',
    category: 'Bathroom & Sanitary',
    categorySlug: 'bathroom',
    basic: 'Any ISI Brand Pipes',
    standard: 'Watertec Pipes',
    premium: 'Kavery / Ashirwad Pipes',
    luxury: 'Finolex / Supreme Pipes',
  },
  {
    id: 14,
    slug: 'main_flooring_balcony_tiles',
    name: 'Main Flooring & Balcony Tiles',
    category: 'Flooring',
    categorySlug: 'flooring',
    basic: "2'x2' Main (Rs. 45/sqft) + 1'x1' Balcony",
    standard: "4'x2' Main (Rs. 50/sqft) + 2'x2' Balcony",
    premium: "4'x2' Main (Rs. 70/sqft) + 2'x2' Balcony",
    luxury: 'Premium Tiles (Rs. 100/sqft) + Balcony',
  },
  {
    id: 15,
    slug: 'staircase',
    name: 'Staircase Flooring',
    category: 'Flooring',
    categorySlug: 'flooring',
    basic: "1'x1' Tiles @ Rs. 35/sq.ft",
    standard: "2'x2' Tiles @ Rs. 50/sq.ft",
    premium: 'Granite @ Rs. 120/sq.ft',
    luxury: 'Premium Granite @ Rs. 160/sq.ft',
  },
  {
    id: 16,
    slug: 'parking',
    name: 'Parking Flooring',
    category: 'Flooring',
    categorySlug: 'flooring',
    basic: 'Tiles @ Rs. 45/sq.ft',
    standard: 'Tiles @ Rs. 50/sq.ft',
    premium: 'Heavy Duty Tiles @ Rs. 70/sq.ft',
    luxury: 'Premium Parking Tiles @ Rs. 100/sq.ft',
  },
  {
    id: 17,
    slug: 'main_door_internal_doors',
    name: 'Main Door & Internal Doors',
    category: 'Doors & Windows',
    categorySlug: 'doors_windows',
    basic: 'Readymade Teak 5"x3" + Flush Doors',
    standard: 'Readymade Teak 5"x4" + Laminated Doors',
    premium: '1st Quality Teak 5"x4" + Teak Doors',
    luxury: '1st Quality Burma Teak 5"x4" + Burma Teak Doors',
  },
  {
    id: 18,
    slug: 'balcony_headroom_doors',
    name: 'Balcony & Headroom Doors',
    category: 'Doors & Windows',
    categorySlug: 'doors_windows',
    basic: 'Flush Door, Sal/Mahogany Frame',
    standard: 'Flush Door, Sal/Mahogany Frame',
    premium: 'Flush Doors with Grill / Steel Doors',
    luxury: 'Flush Doors with Grill / Steel Doors',
  },
  {
    id: 19,
    slug: 'bathroom_doors',
    name: 'Bathroom Doors',
    category: 'Doors & Windows',
    categorySlug: 'doors_windows',
    basic: 'PVC Doors',
    standard: 'WPC Doors',
    premium: 'Laminated WPC Doors',
    luxury: 'FRP Doors',
  },
  {
    id: 20,
    slug: 'painting',
    name: 'Painting (Interior & Exterior)',
    category: 'Painting',
    categorySlug: 'painting',
    basic: '1 Putty + 1 Primer + 2 ISI Emulsion',
    standard: '2 JSW Putty + Asian Primer + Tractor Emulsion',
    premium: '2 Asian Putty + Asian Primer + Apex Emulsion',
    luxury: '3 Asian Putty + Waterproof Primer + Royale/Ultima',
  },
  {
    id: 21,
    slug: 'wires_switches_pipes',
    name: 'Wires, Switches & Electrical Pipes',
    category: 'Electrical & Utilities',
    categorySlug: 'electrical',
    basic: 'Any ISI Brand Wires & Switches',
    standard: 'RR/Orbit Wires + Anchor Roma Switches',
    premium: 'Finolex Wires + Legrand/GM Switches',
    luxury: 'Finolex Wires + Legrand/GM Touch Switches',
  },
  {
    id: 22,
    slug: 'lights',
    name: 'Light Fixtures',
    category: 'Electrical & Utilities',
    categorySlug: 'electrical',
    basic: 'Any ISI Brand Lights',
    standard: 'Luker Lights',
    premium: 'Philips Lights',
    luxury: 'Philips Luxury Lights',
  },
  {
    id: 23,
    slug: 'staircase_balcony_railings',
    name: 'Staircase & Balcony Railings',
    category: 'Railings & Inclusions',
    categorySlug: 'other',
    basic: 'MS Railings',
    standard: 'MS Railings (Std)',
    premium: 'SS 304 Grade Railings',
    luxury: 'Toughened Glass with SS/Wood/Aluminium',
  },
  {
    id: 24,
    slug: 'parapet_wall',
    name: 'Parapet Wall (if headroom built)',
    category: 'Railings & Inclusions',
    categorySlug: 'other',
    basic: '3 ft - 4.5" thick',
    standard: '3 ft - 4.5" thick',
    premium: '3 ft - 9" thick',
    luxury: '3.5 ft - 9" thick',
  },
];

/**
 * The comparison view follows the order a client encounters materials in the
 * build. API rows remain authoritative for content; this only stabilizes their
 * public presentation when per-category database sort orders overlap.
 */
const MATRIX_CATEGORY_ORDER: Record<string, number> = {
  structure: 0,
  design: 1,
  kitchen: 2,
  bathroom: 3,
  flooring: 4,
  doors_windows: 5,
  painting: 6,
  electrical: 7,
  other: 8,
};

const MATRIX_ITEM_ORDER: Record<string, number> = {
  steel_rebar: 0,
  steel_rebar_fe_550d: 0,
  steel_rebar_binding_wires: 0,
  binding_wires: 1,
  cement: 2,
  masonry_work: 3,
  waterproofing: 4,
  waterproofing_basement_pcc: 4,
};

function getMatrixItemOrder(item: ComparisonMatrixItem): number {
  const slugOrder = MATRIX_ITEM_ORDER[item.slug];
  if (slugOrder !== undefined) return slugOrder;

  // Live databases may have older item slugs, so use the stable public names
  // as a fallback rather than allowing a legacy slug to break the sequence.
  const itemName = item.name.toLowerCase();
  if (itemName.includes('steel rebar')) return 0;
  if (itemName.includes('binding wire')) return 1;
  if (itemName.includes('cement')) return 2;
  if (itemName.includes('masonry')) return 3;
  if (itemName.includes('waterproof') || itemName.includes('water proofing')) return 4;

  return Number.MAX_SAFE_INTEGER;
}

function orderMatrixItems(items: ComparisonMatrixItem[]): ComparisonMatrixItem[] {
  return items
    .map((item, originalIndex) => ({ item, originalIndex }))
    .sort((left, right) => {
      const categoryDifference =
        (MATRIX_CATEGORY_ORDER[left.item.categorySlug] ?? Number.MAX_SAFE_INTEGER) -
        (MATRIX_CATEGORY_ORDER[right.item.categorySlug] ?? Number.MAX_SAFE_INTEGER);
      if (categoryDifference !== 0) return categoryDifference;

      const itemDifference = getMatrixItemOrder(left.item) - getMatrixItemOrder(right.item);
      if (itemDifference !== 0) return itemDifference;

      return left.originalIndex - right.originalIndex;
    })
    .map(({ item }) => item);
}

function getIconForItem(slug: string) {
  switch (slug) {
    case 'steel_rebar_binding_wires':
      return Layers;
    case 'cement':
      return Building2;
    case 'masonry_work':
      return BrickWall;
    case 'basement_height':
      return ArrowDownToLine;
    case 'ceiling_height':
      return Ruler;
    case 'waterproofing_basement_pcc':
      return ShieldCheck;
    case 'soil_testing':
      return FlaskConical;
    case 'electrical_plumbing_drawings':
      return Compass;
    case 'isometric_vr':
      return Box;
    case 'kitchen_wall_tiles_countertop':
      return Grid3X3;
    case 'wall_tiles':
      return Grid3X3;
    case 'sanitary_cp_fittings':
      return Bath;
    case 'pvc_cpvc_pipes':
      return Pipette;
    case 'main_flooring_balcony_tiles':
    case 'staircase':
    case 'parking':
      return Grid3X3;
    case 'main_door_internal_doors':
    case 'balcony_headroom_doors':
    case 'bathroom_doors':
      return DoorOpen;
    case 'painting':
      return PaintRoller;
    case 'wires_switches_pipes':
      return Cable;
    case 'lights':
      return Lamp;
    case 'staircase_balcony_railings':
    case 'parapet_wall':
      return Fence;
    default:
      return Building2;
  }
}

function BadgeCheckIcon({ variant }: { variant: 'green' | 'gold' | 'purple' }) {
  const bgColors: Record<'green' | 'gold' | 'purple', string> = {
    green: '#16A34A',
    gold: '#D97706',
    purple: '#7E22CE',
  };
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="11" fill={bgColors[variant]} />
      <path
        d="M7 12.5l3.5 3.5 7-7"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StepPackages({
  formData,
  packages,
  previewResult,
  onChange,
  onNext,
  onBack,
}: StepPackagesProps) {
  const [viewMode, setViewMode] = useState<'matrix' | 'cards'>('cards');
  const [matrixData, setMatrixData] = useState<ComparisonMatrixItem[]>(() =>
    orderMatrixItems(DB_FALLBACK_MATRIX)
  );

  // Fetch real database specification comparison matrix
  useEffect(() => {
    let mounted = true;
    getComparisonMatrix()
      .then((data) => {
        if (mounted && Array.isArray(data) && data.length > 0) {
          setMatrixData(orderMatrixItems(data));
        }
      })
      .catch((err) => {
        // Fallback to embedded DB dataset if API is loading or network error
        console.warn('Using database fallback matrix:', err);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Total built-up area for rate calculation & volume thresholds
  const totalBuiltup = previewResult?.dimensions?.totalBuiltupAreaSqft ?? 0;

  // Map package objects by slug for fast rate lookup
  const pkgMap = useMemo(() => {
    const map = new Map<string, PackageItem>();
    packages.forEach((pkg) => {
      map.set(pkg.slug, pkg);
    });
    return map;
  }, [packages]);

  const getTagline = (slug: string, fallback?: string): string => {
    if (slug === 'standard') return 'Best Value';
    if (slug === 'premium') return 'Family Favorite';
    if (slug === 'basic') return 'Entry Level';
    if (slug === 'luxury') return 'Top Tier';
    return fallback || '';
  };

  // Ensure 4 tiers are always present in the standard order
  const uniquePackages: PackageItem[] = useMemo(() => {
    const order: PackageSlug[] = ['basic', 'standard', 'premium', 'luxury'];
    return order
      .map((slug, idx) => {
        const found = pkgMap.get(slug);
        if (found) {
          return {
            ...found,
            tagline: getTagline(slug, found.tagline),
          };
        }
        const std =
          slug === 'basic'
            ? 2099
            : slug === 'standard'
            ? 2468
            : slug === 'premium'
            ? 2899
            : 3250;
        const vol =
          slug === 'basic'
            ? 1999
            : slug === 'standard'
            ? 2357
            : slug === 'premium'
            ? 2799
            : 3200;
        return {
          id: idx + 1,
          slug,
          name:
            slug === 'basic'
              ? 'Basic Package'
              : slug === 'standard'
              ? 'Standard Package'
              : slug === 'premium'
              ? 'Premium Package'
              : 'Luxury Package',
          tagline: getTagline(slug),
          description: null,
          colorTheme: null,
          sortOrder: idx + 1,
          standardPricePerSqft: std,
          volumePricePerSqft: vol,
          volumeDiscountThresholdSqft: 3500,
          pricing: {
            standardRatePerSqft: std,
            volumeRatePerSqft: vol,
            volumeDiscountThresholdSqft: 3500,
          },
          highlights: PACKAGE_HIGHLIGHTS[slug] || [],
          isRecommended: slug === 'premium',
        } as PackageItem;
      })
      .filter(Boolean);
  }, [pkgMap]);

  // Pricing calculations: Active rate and Strikethrough higher rate
  const getPackageRates = (slug: PackageSlug) => {
    const pkg = pkgMap.get(slug);
    const defaults: Record<PackageSlug, { std: number; vol: number }> = {
      basic: { std: 2099, vol: 1999 },
      standard: { std: 2468, vol: 2357 },
      premium: { std: 2899, vol: 2799 },
      luxury: { std: 3250, vol: 3200 },
    };

    const std = Number(
      pkg?.standardPricePerSqft ??
        pkg?.pricing?.standardRatePerSqft ??
        defaults[slug].std
    );
    const vol = Number(
      pkg?.volumePricePerSqft ??
        pkg?.pricing?.volumeRatePerSqft ??
        defaults[slug].vol
    );
    const threshold =
      pkg?.volumeDiscountThresholdSqft ??
      pkg?.pricing?.volumeDiscountThresholdSqft ??
      3500;

    const isVolume = totalBuiltup > threshold;
    const activeRate = isVolume ? vol : std;

    // The higher rate that must be striked out:
    // If volume discount applies, higher rate is standard rate.
    // If standard rate applies, higher rate is regular market list price (~12% markup).
    const higherRate = isVolume
      ? std
      : Math.round((std * 1.12) / 10) * 10 - 1;

    return {
      activeRate,
      higherRate,
      isVolume,
      threshold,
    };
  };

  const renderCellContent = (value: string, tier: PackageSlug): React.ReactNode => {
    if (!value || value === '—' || value.toLowerCase().includes('not included')) {
      return <span className="pkg-matrix-dash" aria-label="Not included">—</span>;
    }

    // Check if the value is an included feature or signature upgrade
    const isIncludedBadge =
      value.toLowerCase().includes('included') ||
      value.toLowerCase().includes('all day on site') ||
      value.toLowerCase().includes('11 ft ceiling');

    if (isIncludedBadge) {
      const variant =
        tier === 'basic' ? 'green' : tier === 'luxury' ? 'purple' : 'gold';
      return (
        <span className={`pkg-matrix-badge pkg-matrix-badge--${variant}`}>
          <BadgeCheckIcon variant={variant} />
          <span>{value}</span>
        </span>
      );
    }

    return <span>{value}</span>;
  };

  return (
    <div className="calculator-step animate-fade-in">
      {/* Header Section */}
      <div className="text-center mb-6 pt-2">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[#0B192C] uppercase font-sans">
          CHOOSE THE PERFECT BUILD FOR YOU
        </h2>
        <p className="text-sm sm:text-base text-gray-600 mt-1.5 font-medium">
          Quality materials. Expert craftsmanship. Complete peace of mind.
        </p>

        {/* Decorative gold ornament divider */}
        <div className="flex items-center justify-center gap-3 my-3">
          <div className="h-[1px] w-20 bg-gray-300" />
          <span className="text-amber-500 text-xs">◆</span>
          <div className="h-[1px] w-20 bg-gray-300" />
        </div>

        {/* View Toggle */}
        <div className="inline-flex items-center gap-1 p-1 bg-white border border-gray-200 rounded-lg shadow-2xs mt-2">
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-colors ${
              viewMode === 'cards'
                ? 'bg-[#0B192C] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <LayoutGrid size={13} aria-hidden="true" />
            <span>Package Cards</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('matrix')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-colors ${
              viewMode === 'matrix'
                ? 'bg-[#0B192C] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Columns size={13} aria-hidden="true" />
            <span>Comparison Matrix</span>
          </button>
        </div>
      </div>

      {viewMode === 'matrix' ? (
        /* ====================================================
           SPECIFICATION COMPARISON MATRIX (REAL DB SPECIFICATIONS)
           ==================================================== */
        <div className="pkg-matrix-section">
          <div className="pkg-matrix-scroll-wrapper">
            <table className="pkg-matrix-table" aria-label="Package Specifications Matrix">
              <thead>
                <tr>
                  {/* Column 1: Features Header */}
                  <th className="pkg-matrix-th pkg-matrix-th--sticky pkg-matrix-th--feature" scope="col">
                    <div className="pkg-matrix-header-card pkg-matrix-header-card--navy">
                      <span className="pkg-matrix-header-card__title text-center">FEATURES /</span>
                      <span className="pkg-matrix-header-card__subtitle text-center">SPECIFICATIONS</span>
                    </div>
                  </th>

                  {/* Column 2: Basic Package */}
                  {(() => {
                    const rates = getPackageRates('basic');
                    const isSelected = formData.packageSlug === 'basic';
                    return (
                      <th className="pkg-matrix-th" scope="col">
                        <div
                          className="pkg-matrix-header-card pkg-matrix-header-card--basic"
                          onClick={() => onChange({ packageSlug: 'basic' })}
                          role="button"
                          tabIndex={0}
                          aria-pressed={isSelected}
                          data-selected={isSelected || undefined}
                        >
                          {isSelected && (
                            <span className="pkg-matrix-header-card__active-pill">Selected</span>
                          )}
                          <div className="pkg-matrix-header-card__inner">
                            <div className="pkg-matrix-header-card__icon-box">
                              <Home size={20} strokeWidth={2.2} aria-hidden="true" />
                            </div>
                            <div className="pkg-matrix-header-card__text">
                              <span className="pkg-matrix-header-card__title">BASIC</span>
                              <span className="pkg-matrix-header-card__subtitle">PACKAGE</span>
                            </div>
                          </div>
                          <div className="pkg-matrix-header-card__rates">
                            <span className="pkg-matrix-header-card__rate-strikethrough">
                              ₹{rates.higherRate.toLocaleString('en-IN')}
                            </span>
                            <span className="pkg-matrix-header-card__rate-tag">
                              ₹{rates.activeRate.toLocaleString('en-IN')}/sq.ft
                            </span>
                          </div>
                        </div>
                      </th>
                    );
                  })()}

                  {/* Column 3: Standard Package */}
                  {(() => {
                    const rates = getPackageRates('standard');
                    const isSelected = formData.packageSlug === 'standard';
                    return (
                      <th className="pkg-matrix-th" scope="col">
                        <div
                          className="pkg-matrix-header-card pkg-matrix-header-card--standard"
                          onClick={() => onChange({ packageSlug: 'standard' })}
                          role="button"
                          tabIndex={0}
                          aria-pressed={isSelected}
                          data-selected={isSelected || undefined}
                        >
                          {isSelected && (
                            <span className="pkg-matrix-header-card__active-pill">Selected</span>
                          )}
                          <div className="pkg-matrix-header-card__inner">
                            <div className="pkg-matrix-header-card__icon-box">
                              <Shield size={20} strokeWidth={2.2} aria-hidden="true" />
                            </div>
                            <div className="pkg-matrix-header-card__text">
                              <span className="pkg-matrix-header-card__title">STANDARD</span>
                              <span className="pkg-matrix-header-card__subtitle">PACKAGE</span>
                            </div>
                          </div>
                          <div className="pkg-matrix-header-card__rates">
                            <span className="pkg-matrix-header-card__rate-strikethrough">
                              ₹{rates.higherRate.toLocaleString('en-IN')}
                            </span>
                            <span className="pkg-matrix-header-card__rate-tag">
                              ₹{rates.activeRate.toLocaleString('en-IN')}/sq.ft
                            </span>
                          </div>
                        </div>
                      </th>
                    );
                  })()}

                  {/* Column 4: Premium Package */}
                  {(() => {
                    const rates = getPackageRates('premium');
                    const isSelected = formData.packageSlug === 'premium';
                    return (
                      <th className="pkg-matrix-th" scope="col">
                        <div
                          className="pkg-matrix-header-card pkg-matrix-header-card--premium"
                          onClick={() => onChange({ packageSlug: 'premium' })}
                          role="button"
                          tabIndex={0}
                          aria-pressed={isSelected}
                          data-selected={isSelected || undefined}
                        >
                          {isSelected && (
                            <span className="pkg-matrix-header-card__active-pill">Selected</span>
                          )}
                          <div className="pkg-matrix-header-card__inner">
                            <div className="pkg-matrix-header-card__icon-box">
                              <Gem size={20} strokeWidth={2.2} aria-hidden="true" />
                            </div>
                            <div className="pkg-matrix-header-card__text">
                              <span className="pkg-matrix-header-card__title">PREMIUM</span>
                              <span className="pkg-matrix-header-card__subtitle">PACKAGE</span>
                            </div>
                          </div>
                          <div className="pkg-matrix-header-card__rates">
                            <span className="pkg-matrix-header-card__rate-strikethrough">
                              ₹{rates.higherRate.toLocaleString('en-IN')}
                            </span>
                            <span className="pkg-matrix-header-card__rate-tag">
                              ₹{rates.activeRate.toLocaleString('en-IN')}/sq.ft
                            </span>
                          </div>
                        </div>
                      </th>
                    );
                  })()}

                  {/* Column 5: Luxury Package */}
                  {(() => {
                    const rates = getPackageRates('luxury');
                    const isSelected = formData.packageSlug === 'luxury';
                    return (
                      <th className="pkg-matrix-th pkg-matrix-th--luxury" scope="col">
                        <div
                          className="pkg-matrix-header-card pkg-matrix-header-card--luxury"
                          onClick={() => onChange({ packageSlug: 'luxury' })}
                          role="button"
                          tabIndex={0}
                          aria-pressed={isSelected}
                          data-selected={isSelected || undefined}
                        >
                          {isSelected && (
                            <span className="pkg-matrix-header-card__active-pill">Selected</span>
                          )}
                          <div className="pkg-matrix-header-card__inner">
                            <div className="pkg-matrix-header-card__icon-box">
                              <Crown size={20} strokeWidth={2.2} aria-hidden="true" />
                            </div>
                            <div className="pkg-matrix-header-card__text">
                              <span className="pkg-matrix-header-card__title">LUXURY</span>
                              <span className="pkg-matrix-header-card__subtitle">PACKAGE</span>
                            </div>
                          </div>
                          <div className="pkg-matrix-header-card__rates">
                            <span className="pkg-matrix-header-card__rate-strikethrough">
                              ₹{rates.higherRate.toLocaleString('en-IN')}
                            </span>
                            <span className="pkg-matrix-header-card__rate-tag">
                              ₹{rates.activeRate.toLocaleString('en-IN')}/sq.ft
                            </span>
                          </div>
                        </div>
                      </th>
                    );
                  })()}
                </tr>
              </thead>
              <tbody>
                {matrixData.map((row) => {
                  const ItemIcon = getIconForItem(row.slug);
                  return (
                    <tr key={row.id || row.slug} className="pkg-matrix-row">
                      {/* Feature Name & Category Icon */}
                      <td className="pkg-matrix-td pkg-matrix-td--sticky">
                        <div className="pkg-matrix-feature">
                          <div className="pkg-matrix-feature__icon">
                            <ItemIcon size={16} aria-hidden="true" />
                          </div>
                          <div>
                            <span className="pkg-matrix-feature__name block">{row.name}</span>
                            <span className="text-[10px] text-gray-500 font-normal">
                              {row.category}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Basic Cell */}
                      <td
                        className={`pkg-matrix-td pkg-matrix-td--col ${
                          formData.packageSlug === 'basic' ? 'pkg-matrix-td--selected' : ''
                        }`}
                        onClick={() => onChange({ packageSlug: 'basic' })}
                        role="button"
                        tabIndex={0}
                        aria-label={`Select Basic package - ${row.name}`}
                      >
                        {renderCellContent(row.basic, 'basic')}
                      </td>

                      {/* Standard Cell */}
                      <td
                        className={`pkg-matrix-td pkg-matrix-td--col ${
                          formData.packageSlug === 'standard' ? 'pkg-matrix-td--selected' : ''
                        }`}
                        onClick={() => onChange({ packageSlug: 'standard' })}
                        role="button"
                        tabIndex={0}
                        aria-label={`Select Standard package - ${row.name}`}
                      >
                        {renderCellContent(row.standard, 'standard')}
                      </td>

                      {/* Premium Cell */}
                      <td
                        className={`pkg-matrix-td pkg-matrix-td--col ${
                          formData.packageSlug === 'premium' ? 'pkg-matrix-td--selected' : ''
                        }`}
                        onClick={() => onChange({ packageSlug: 'premium' })}
                        role="button"
                        tabIndex={0}
                        aria-label={`Select Premium package - ${row.name}`}
                      >
                        {renderCellContent(row.premium, 'premium')}
                      </td>

                      {/* Luxury Cell */}
                      <td
                        className={`pkg-matrix-td pkg-matrix-td--col ${
                          formData.packageSlug === 'luxury' ? 'pkg-matrix-td--selected' : ''
                        }`}
                        onClick={() => onChange({ packageSlug: 'luxury' })}
                        role="button"
                        tabIndex={0}
                        aria-label={`Select Luxury package - ${row.name}`}
                      >
                        {renderCellContent(row.luxury, 'luxury')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-center mt-5 mb-2">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className="inline-flex items-center gap-2 text-xs font-bold text-gray-700 hover:text-black bg-white border border-gray-300 hover:border-gray-500 px-4 py-2 rounded-lg shadow-2xs transition-all cursor-pointer"
            >
              <LayoutGrid size={14} aria-hidden="true" />
              <span>Back to Package Cards</span>
            </button>
          </div>
        </div>
      ) : (
        /* ====================================================
           4-CARD OVERVIEW GRID (WITH STRIKETHROUGH PRICING)
           ==================================================== */
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {uniquePackages.map((pkg) => {
            const isSelected = formData.packageSlug === pkg.slug;
            const rates = getPackageRates(pkg.slug as PackageSlug);
            const highlights =
              pkg.highlights && Array.isArray(pkg.highlights) && pkg.highlights.length > 0
                ? pkg.highlights
                : PACKAGE_HIGHLIGHTS[pkg.slug] || [];
            const isPopular = pkg.isRecommended ?? pkg.slug === 'premium';

            return (
              <div key={pkg.id || pkg.slug} className="calculator-package-slot">
                <div
                  onClick={() => onChange({ packageSlug: pkg.slug as PackageSlug })}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onChange({ packageSlug: pkg.slug as PackageSlug });
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Select ${pkg.name}`}
                  aria-pressed={isSelected}
                  data-selected={isSelected || undefined}
                  className={`calculator-choice calculator-choice--package package-card p-5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between h-full ${
                    isSelected
                      ? 'bg-[#243228] text-white border-white/20 shadow-2xl scale-[1.025] z-10'
                      : 'bg-white border-gray-200 hover:border-gray-400 text-gray-900'
                  }`}
                >
                  {isPopular && (
                    <span className="calculator-package-ribbon">
                      <Star size={11} strokeWidth={3} aria-hidden="true" />
                      Most Popular
                      <Star size={11} strokeWidth={3} aria-hidden="true" />
                    </span>
                  )}

                  <div>
                    <div className="calculator-package-head">
                      <span aria-hidden="true" />
                      <span className={`calculator-tick ${isSelected ? 'border-white/75 text-white bg-transparent' : 'border-gray-300'}`}>
                        <Check size={12} strokeWidth={2.5} aria-hidden="true" className={isSelected ? 'text-white' : 'text-transparent'} />
                      </span>
                    </div>

                    <h3 className={`text-base font-bold mb-1 ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                      {pkg.name}
                    </h3>

                    <p className={`calculator-package-tagline text-xs font-medium mb-3 ${isSelected ? 'text-gray-300' : 'text-gray-600'}`}>
                      {getTagline(pkg.slug, pkg.tagline)}
                    </p>

                    <div className={`calculator-choice__inset p-3 rounded-lg border mb-4 ${isSelected ? 'bg-white/10 border-white/15' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-baseline justify-center gap-2">
                        <span className={`text-xs line-through font-medium ${isSelected ? 'text-gray-400' : 'text-gray-400'}`}>
                          ₹{rates.higherRate.toLocaleString('en-IN')}
                        </span>
                        <span className={`text-xs ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>₹</span>
                        <span className={`text-2xl font-bold tabular-nums ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                          {rates.activeRate.toLocaleString('en-IN')}
                        </span>
                        <span className={`text-xs ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>/ sq.ft</span>
                      </div>
                      {rates.isVolume && (
                        <div className={`calculator-volume-note text-center mt-1 text-xs font-semibold ${isSelected ? 'text-emerald-300' : 'text-green-700'}`}>
                          Volume Discount Applied (&gt;{rates.threshold.toLocaleString('en-IN')} sqft)
                        </div>
                      )}
                    </div>

                    <ul className={`space-y-2 text-xs mb-6 ${isSelected ? 'text-gray-200' : 'text-gray-600'}`}>
                      {highlights.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check
                            size={14}
                            className={`shrink-0 mt-0.5 ${isSelected ? 'text-white' : 'text-gray-700'}`}
                            aria-hidden="true"
                          />
                          <span className={isSelected ? 'text-gray-100' : 'text-gray-700'}>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Compare specifications action button */}
          <div className="flex justify-center mb-6">
            <button
              type="button"
              onClick={() => setViewMode('matrix')}
              className="inline-flex items-center gap-2 text-xs font-bold text-gray-700 hover:text-black bg-white border border-gray-300 hover:border-gray-500 px-4 py-2.5 rounded-lg shadow-2xs transition-all cursor-pointer"
            >
              <Columns size={14} aria-hidden="true" />
              <span>Compare Specifications &amp; Features</span>
            </button>
          </div>
        </>
      )}

      {/* Navigation Actions */}
      <div className="calculator-actions p-4 rounded-xl border border-gray-200 bg-white flex items-center justify-between shadow-xs">
        <button
          type="button"
          onClick={onBack}
          className="button button--ghost flex items-center gap-2 font-semibold"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Back</span>
        </button>
        <button
          type="button"
          onClick={onNext}
          className="button button--solid flex items-center gap-2 font-bold px-6 py-2.5 bg-[#0B192C] text-white rounded-md hover:bg-black transition-colors"
        >
          <span>Customize &amp; Add-Ons</span>
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

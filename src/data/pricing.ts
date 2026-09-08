import type {
  Package,
  Location,
  UpgradeCategory,
  AddonItem,
  Milestone,
} from '@/lib/pricing/types';

export * from '@/lib/pricing/types';
export { PARKING_SQFT } from '@/lib/pricing/engine';

/** Built-up area above which the volume rate applies. */
export const VOLUME_THRESHOLD_SQFT = 3500;

export const PACKAGES: Package[] = [
  {
    key: 'basic',
    name: 'Basic',
    standardRate: 2099,
    volumeRate: 2000,
    highlights: 'ISI steel, fly-ash blocks, M20 mix, 9.5 ft ceiling',
  },
  {
    key: 'standard',
    name: 'Standard',
    standardRate: 2468,
    volumeRate: 2357,
    highlights: 'Vizag steel, JSW cement, 10 ft ceiling, Dr. Fixit waterproofing',
  },
  {
    key: 'premium',
    name: 'Premium',
    standardRate: 2899,
    volumeRate: 2799,
    highlights: 'ARS/Suryadev steel, Ramco cement, teak doors, Somany tiles',
  },
  {
    key: 'luxury',
    name: 'Luxury',
    standardRate: 3250,
    volumeRate: 3200,
    highlights: 'TATA/JSW steel, Ultratech cement, red brick, Kohler sanitary',
  },
];

/**
 * Only Chennai and Pollachi have documented multipliers. The rest default to
 * 1.00 and must be confirmed before launch — docs/01-MASTER-PLAN.md section 9.
 */
export const LOCATIONS: Location[] = [
  { slug: 'chennai', name: 'Chennai', multiplier: 1.05, confirmed: true },
  { slug: 'pollachi', name: 'Pollachi', multiplier: 0.96, confirmed: true },
  { slug: 'coimbatore', name: 'Coimbatore', multiplier: 1.0, confirmed: false },
  { slug: 'madurai', name: 'Madurai', multiplier: 1.0, confirmed: false },
  { slug: 'tiruppur', name: 'Tiruppur', multiplier: 1.0, confirmed: false },
  { slug: 'erode', name: 'Erode', multiplier: 1.0, confirmed: false },
  { slug: 'salem', name: 'Salem', multiplier: 1.0, confirmed: false },
];

/**
 * The ten brand upgrade categories.
 * Options with unknown deltas are explicitly typed `deltaPerSqft: null`
 * and must never be defaulted to 0. (Project rule 3: never invent missing prices).
 */
export const UPGRADE_CATEGORIES: readonly UpgradeCategory[] = [
  {
    slug: 'structural-steel',
    name: 'Structural steel',
    options: [
      { slug: 'standard-fe550d', name: 'Standard Fe 550D', deltaPerSqft: 0, isDefault: true },
      { slug: 'jsw-steel', name: 'JSW Steel', deltaPerSqft: null },
      { slug: 'tata-steel', name: 'TATA Tiscon', deltaPerSqft: null },
      { slug: 'ars-steel', name: 'ARS / Suryadev', deltaPerSqft: null },
      { slug: 'vizag-steel', name: 'Vizag Steel', deltaPerSqft: null },
    ],
  },
  {
    slug: 'cement',
    name: 'Cement',
    options: [
      { slug: 'standard-cement', name: 'Standard Grade 53', deltaPerSqft: 0, isDefault: true },
      { slug: 'ultratech-cement', name: 'Ultratech', deltaPerSqft: null },
      { slug: 'ramco-cement', name: 'Ramco', deltaPerSqft: null },
      { slug: 'dalmia-cement', name: 'Dalmia', deltaPerSqft: null },
      { slug: 'jsw-cement', name: 'JSW Concreel', deltaPerSqft: null },
    ],
  },
  {
    slug: 'masonry',
    name: 'Masonry',
    options: [
      { slug: 'solid-blocks', name: 'Solid Concrete / AAC Blocks', deltaPerSqft: 0, isDefault: true },
      { slug: 'country-red-brick', name: 'Wire-Cut Red Brick', deltaPerSqft: 100 },
      { slug: 'first-class-red-brick', name: 'First-Class Chamber Red Brick', deltaPerSqft: 120 },
    ],
  },
  {
    slug: 'flooring',
    name: 'Flooring',
    options: [
      { slug: 'standard-vitrified', name: 'Standard Vitrified Tiles (2x2 ft)', deltaPerSqft: 0, isDefault: true },
      { slug: 'large-vitrified', name: 'Large-Format Glazed Vitrified (4x2 ft)', deltaPerSqft: null },
      { slug: 'italian-marble', name: 'Imported Italian Marble', deltaPerSqft: null },
    ],
  },
  {
    slug: 'doors-windows',
    name: 'Doors & windows',
    options: [
      { slug: 'standard-flush', name: 'Factory Flush Doors / UPVC Standard', deltaPerSqft: 0, isDefault: true },
      { slug: 'first-quality-teak', name: 'First-Quality Burma Teak Main Door', deltaPerSqft: null },
      { slug: 'upvc-mesh-3track', name: 'UPVC 3-Track Sliding with Bug Mesh', deltaPerSqft: null },
    ],
  },
  {
    slug: 'sanitary',
    name: 'Sanitary & CP',
    options: [
      { slug: 'standard-sanitary', name: 'Standard Parryware / Cera', deltaPerSqft: 0, isDefault: true },
      { slug: 'jaquar-sanitary', name: 'Jaquar Continental / Kubix', deltaPerSqft: null },
      { slug: 'kohler-sanitary', name: 'Kohler Modern', deltaPerSqft: null },
      { slug: 'toto-sanitary', name: 'Toto Premium', deltaPerSqft: null },
    ],
  },
  {
    slug: 'electrical',
    name: 'Electrical',
    options: [
      { slug: 'standard-modular', name: 'Standard Modular Switches', deltaPerSqft: 0, isDefault: true },
      { slug: 'havells-modular', name: 'Havells Fabio Modular', deltaPerSqft: null },
      { slug: 'finolex-modular', name: 'Finolex FRLS / Modular', deltaPerSqft: null },
      { slug: 'legrand-modular', name: 'Legrand Arteor Smart Ready', deltaPerSqft: null },
    ],
  },
  {
    slug: 'painting',
    name: 'Painting',
    options: [
      { slug: 'standard-emulsion', name: 'Tractor Emulsion / Weather Shield', deltaPerSqft: 0, isDefault: true },
      { slug: 'asian-royale', name: 'Asian Paints Royale Luxury Emulsion', deltaPerSqft: null },
      { slug: 'apex-ultima', name: 'Asian Paints Apex Ultima Protek', deltaPerSqft: null },
    ],
  },
  {
    slug: 'waterproofing',
    name: 'Waterproofing',
    options: [
      { slug: 'standard-waterproofing', name: 'Standard Elastomeric Coating', deltaPerSqft: 0, isDefault: true },
      { slug: 'chemical-injection', name: '3-Layer Chemical Injection & Crystalline Membrane', deltaPerSqft: null },
    ],
  },
  {
    slug: 'drawings',
    name: 'Drawings & vetting',
    options: [
      { slug: 'standard-drawings', name: 'Complete Coordinated Working Drawings', deltaPerSqft: 0, isDefault: true },
      { slug: 'vr-walkthrough', name: '3D VR Virtual Reality Walkthrough', deltaPerSqft: null },
      { slug: 'structural-vetting', name: 'Third-Party Structural Engineering Vetting', deltaPerSqft: null },
    ],
  },
];

/**
 * Add-on catalogue (15 items) matching calculator spec and backend seed.
 */
export const ADDONS_CATALOGUE: readonly AddonItem[] = [
  {
    slug: 'underground-sump',
    name: 'Underground RCC / Fly-Ash Sump',
    description: 'Underground water storage sump. Capacity selected in litres.',
    pricingUnit: 'per_litre',
    price: 26,
    defaultQuantity: 5000,
    minQuantity: 1000,
    maxQuantity: 20000,
    unitLabel: 'Litres',
  },
  {
    slug: 'septic-tank',
    name: 'Conventional Septic Tank',
    description: 'Volume-based septic tank. Capacity selected in litres.',
    pricingUnit: 'per_litre',
    price: 30,
    defaultQuantity: 2000,
    minQuantity: 1000,
    maxQuantity: 10000,
    unitLabel: 'Litres',
  },
  {
    slug: 'rainwater-harvesting',
    name: 'Rainwater Harvesting System',
    description: 'Complete rooftop rainwater capture with filter bed and groundwater recharge.',
    pricingUnit: 'fixed',
    price: 35000,
  },
  {
    slug: 'compound-wall',
    name: 'Red Brick Compound Wall',
    description: 'Perimeter compound wall up to 5\'6" height with coping.',
    pricingUnit: 'per_rft',
    price: 2900,
    defaultQuantity: 100,
    minQuantity: 10,
    maxQuantity: 500,
    unitLabel: 'Running Feet',
  },
  {
    slug: 'cctv-surveillance',
    name: 'CCTV Surveillance (8 Cameras)',
    description: 'Complete 8-camera color night-vision setup with NVR, 2TB HDD, and wiring.',
    pricingUnit: 'fixed',
    price: 45000,
  },
  {
    slug: 'video-door-phone',
    name: 'Video Door Phone',
    description: 'Weatherproof outdoor doorbell camera and 7-inch indoor touchscreen unit.',
    pricingUnit: 'fixed',
    price: 22000,
  },
  {
    slug: 'rooftop-solar',
    name: 'Rooftop Solar 3kW Grid-Tied',
    description: 'Grid-tied rooftop solar panel system with net-metering assistance.',
    pricingUnit: 'fixed',
    price: 180000,
  },
  {
    slug: 'ev-charging',
    name: 'EV Car Charging Station',
    description: 'Dedicated 7.4kW AC home charging point with surge protection.',
    pricingUnit: 'fixed',
    price: 35000,
  },
  {
    slug: 'passenger-lift',
    name: '4-Passenger Automatic Lift',
    description: 'Complete 4-passenger elevator with automatic doors, ARD, and stainless cabin.',
    pricingUnit: 'fixed',
    price: 1250000,
  },
  {
    slug: 'modular-kitchen',
    name: 'Modular Acrylic / Marine Kitchen',
    description: 'Marine-grade BWP plywood carcass, soft-close hardware, and high-gloss shutters.',
    pricingUnit: 'fixed',
    price: 250000,
  },
  {
    slug: 'pop-false-ceiling',
    name: 'POP False Ceiling',
    description: 'Designer plaster false ceiling with peripheral lighting troughs.',
    pricingUnit: 'per_sqft',
    price: 110,
    defaultQuantity: 1000,
    minQuantity: 100,
    maxQuantity: 5000,
    unitLabel: 'Sq.Ft',
  },
  {
    slug: 'overhead-tank',
    name: 'Overhead Concrete Water Tank',
    description: 'Monolithic RCC overhead water tank.',
    pricingUnit: 'per_litre',
    price: 35,
    defaultQuantity: 1000,
    minQuantity: 500,
    maxQuantity: 10000,
    unitLabel: 'Litres',
  },
  {
    slug: 'main-gate',
    name: 'Main Entrance Gate',
    description: 'Architectural steel entry gate.',
    pricingUnit: 'per_sqft',
    price: 150,
    defaultQuantity: 60,
    minQuantity: 20,
    maxQuantity: 200,
    unitLabel: 'Sq.Ft',
  },
  {
    slug: 'solar-water-heater',
    name: 'Solar Water Heater (200L)',
    description: 'Rooftop solar water heating system with insulated storage tank.',
    pricingUnit: 'fixed',
    price: 35000,
  },
  {
    slug: 'motor-automation',
    name: 'Water Motor Automation',
    description: 'Automatic water controller with dry-run protection and auto cut-off.',
    pricingUnit: 'fixed',
    price: 12000,
  },
];

/**
 * Milestone schedule — exactly 10 stages summing to 100.0%.
 * From docs/05-CALCULATOR-SPEC.md §3.
 */
export const MILESTONES: readonly Milestone[] = [
  { n: 1,  pct: 3,  label: 'Design, approvals & architectural plan' },
  { n: 2,  pct: 4,  label: 'Earthwork excavation & anti-termite treatment' },
  { n: 3,  pct: 15, label: 'Foundation footing, plinth beams & basement filling' },
  { n: 4,  pct: 22, label: 'RCC columns, roof slab casting & shuttering' },
  { n: 5,  pct: 14, label: 'Brickwork, AAC blocks, lintels & parapet walls' },
  { n: 6,  pct: 8,  label: 'Concealed electrical conduits & plumbing lines' },
  { n: 7,  pct: 10, label: 'Internal levelling & external weather plastering' },
  { n: 8,  pct: 11, label: 'Flooring, bathroom tiling & kitchen countertops' },
  { n: 9,  pct: 8,  label: 'Primer, emulsion painting, doors & windows' },
  { n: 10, pct: 5,  label: 'Sanitary ware, switchboards, deep clean & handover' },
] as const;

/** Indian digit grouping: 2,099 / 12,50,000 */
export function formatRupees(value: number): string {
  return new Intl.NumberFormat('en-IN').format(value);
}

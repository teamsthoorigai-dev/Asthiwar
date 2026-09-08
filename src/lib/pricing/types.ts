/** Plot area unit. Conversion factors live in UNIT_TO_SQFT in the engine. */
export type PlotUnit = 'sqft' | 'cents' | 'sqyards';

/** Floor count. Multipliers live in FLOOR_MULTIPLIER in the engine. */
export type FloorKey = 'ground' | 'g1' | 'g2' | 'g3';

export type ParkingKey = 'none' | 'one' | 'two';

export type PackageKey = 'basic' | 'standard' | 'premium' | 'luxury';

export type Package = {
  key: PackageKey;
  name: string;
  standardRate: number;
  volumeRate: number;
  highlights: string;
};

export type Location = {
  slug: string;
  name: string;
  multiplier: number;
  confirmed: boolean;
};

export type UpgradeOption = {
  slug: string;
  name: string;
  /**
   * Additional rate per square foot.
   * Project rule 3: must be number | null and never defaulted to 0 if unknown.
   */
  deltaPerSqft: number | null;
  isDefault?: boolean;
  specification?: string;
};

export type UpgradeCategory = {
  slug: string;
  name: string;
  options: readonly UpgradeOption[];
};

export type AddonPricingUnit =
  | 'per_litre'
  | 'per_rft'
  | 'per_sqft'
  | 'fixed';

export type AddonItem = {
  slug: string;
  name: string;
  description: string;
  pricingUnit: AddonPricingUnit;
  price: number;
  defaultQuantity?: number;
  minQuantity?: number;
  maxQuantity?: number;
  unitLabel?: string;
};

export type Milestone = {
  n: number;
  pct: number;
  label: string;
};

export type SelectedUpgrade = {
  categorySlug: string;
  optionSlug: string;
  deltaPerSqft: number | null;
};

export type SelectedAddon = {
  slug: string;
  name: string;
  price: number;
  quantity: number;
  unit?: string;
};

export type EstimateInput = {
  plotArea: number;
  plotUnit: PlotUnit;
  perFloor: number;
  floors: FloorKey;
  parking: ParkingKey;
  package: Package;
  locationMultiplier: number;
  locationSlug?: string;
  upgrades: readonly SelectedUpgrade[];
  addOns: readonly SelectedAddon[];
};

export type EstimateMilestone = {
  n: number;
  pct: number;
  label: string;
  amount: number;
};

export type EstimateResult = {
  builtUp: number;
  rate: number;
  effectiveRate: number;
  baseCost: number;
  upgradesCost: number;
  addOnsCost: number;
  total: number;
  volumeApplied: boolean;
  milestones: EstimateMilestone[];
};

export type WizardStep = 0 | 1 | 2 | 3 | 4;

export type LeadInfo = {
  name: string;
  phone: string;
  email: string;
  location: string;
  notes?: string;
};

export type DimensionsInfo = {
  plotArea: number;
  plotUnit: PlotUnit;
  perFloorSqft: number;
  parking: ParkingKey;
};

export type FloorsInfo = {
  floors: FloorKey;
};

export type CalculatorState = {
  step: WizardStep;
  lead: LeadInfo;
  dimensions: DimensionsInfo;
  floors: FloorsInfo;
  selectedPackage: PackageKey;
  upgrades: Record<string, string>;
  addOns: Record<string, number>;
};

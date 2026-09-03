export type AreaUnit = 'sqft' | 'sqyards' | 'cents' | 'sqm';
export type FloorCount = number;
export type PackageSlug = 'basic' | 'standard' | 'premium' | 'luxury';

export interface LocationItem {
  id: number;
  name: string;
  slug: string;
  priceMultiplier: number;
  sortOrder: number;
}

export interface PackagePricingSummary {
  standardRatePerSqft: number;
  volumeDiscountThresholdSqft: number;
  volumeRatePerSqft: number;
}

export interface PackageItem {
  id: number;
  slug: PackageSlug;
  name: string;
  tagline: string;
  description: string | null;
  colorTheme: string | null;
  sortOrder: number;
  standardPricePerSqft: number;
  volumePricePerSqft: number;
  volumeDiscountThresholdSqft: number;
  pricing: PackagePricingSummary;
}

export interface OptionItem {
  id: number;
  slug: string;
  brandName: string;
  specification: string | null;
  isPackageDefault: boolean;
  priceDelta: number;
  priceType: string;
}

export interface SpecificationItem {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  unit: string;
  isCustomizable: boolean;
  isIncluded: boolean;
  includedCoverage: string | null;
  additionalCostPrice: number;
  defaultOptionId: number | null;
  options: OptionItem[];
}

export interface CategoryItem {
  id: number;
  slug: string;
  name: string;
  items: SpecificationItem[];
}

export interface AddonVariantItem {
  variantSlug: string;
  variantName: string;
  packageTier: string;
  price: number;
}

export interface AddonItem {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  pricingUnit: string;
  /** true when several variants may be fitted together (e.g. motor automation). */
  allowsMultiple: boolean;
  defaultQuantity: number | null;
  minQuantity: number | null;
  maxQuantity: number | null;
  variants: AddonVariantItem[];
}

export interface PackageConfigResponse {
  package: {
    id: number;
    slug: string;
    name: string;
    tagline: string;
    description: string | null;
    colorTheme: string | null;
  };
  specifications: CategoryItem[];
  addons: AddonItem[];
}

export interface CustomizationInput {
  itemSlug: string;
  optionSlug: string;
}

export interface AddonInput {
  addonSlug: string;
  variantSlug: string;
  quantity?: number;
}

export interface CalculatorInput {
  // Step 0: Lead Info
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  plotLocation: string;
  locationId?: number;

  // Step 1: Dimensions
  plotArea: number;
  plotAreaUnit?: AreaUnit;
  builtupAreaPerFloor: number;
  builtupAreaUnit?: AreaUnit;
  carParkingAreaSqft?: number;
  carCount?: number;

  // Step 2: Floors
  floorCount: FloorCount;
  floorBreakdown?: number[];
  headRoomAreaSqft?: number;

  // Step 3: Package
  packageSlug: PackageSlug;

  // Step 4: Customizations & Add-Ons
  customizations?: CustomizationInput[];
  addons?: AddonInput[];
}

export interface MilestoneStage {
  stageNumber: number;
  stageName: string;
  percentage: number;
  amount: number;
  keyDeliverables: string;
}

export interface CustomizationDetail {
  itemId: number;
  itemSlug: string;
  itemName: string;
  selectedOptionId: number;
  selectedOptionSlug: string;
  selectedOptionName: string;
  unitPriceDelta: number;
  priceType: string;
  calculatedPrice: number;
}

export interface AddonDetail {
  addonId: number;
  addonSlug: string;
  addonName: string;
  selectedVariantSlug: string;
  selectedVariantName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface CalculationResult {
  estimateNumber: string;
  estimateId?: string;
  customer: {
    name: string;
    phone: string;
    email: string;
    location: string;
  };
  dimensions: {
    plotAreaSqft: number;
    plotAreaUnit: AreaUnit;
    builtupAreaPerFloorSqft: number;
    floorCount: FloorCount;
    numberOfFloors: number;
    carParkingAreaSqft: number;
    carCount: number;
    totalBuiltupAreaSqft: number;
  };
  package: {
    id: number;
    slug: PackageSlug;
    name: string;
    tagline: string;
    baseRatePerSqft: number;
    effectiveRatePerSqft: number;
    isVolumeRateApplied: boolean;
    locationMultiplier: number;
    locationName: string;
  };
  breakdown: {
    baseConstructionCost: number;
    upgradesCost: number;
    addonsCost: number;
    subtotalCost: number;
    gstPercentage: number;
    gstAmount: number;
    totalProjectCost: number;
    effectiveTotalCostPerSqft: number;
  };
  duration: {
    estimatedMonthsRange: string;
    minMonths: number;
    maxMonths: number;
  };
  customizations: CustomizationDetail[];
  addons: AddonDetail[];
  milestones: MilestoneStage[];
  disclaimers: string[];
}

export interface HealthResponse {
  status: 'healthy' | 'degraded';
  timestamp: string;
  service: string;
  version: string;
  database: {
    provider: string;
    connected: boolean;
    message?: string;
    latencyMs?: number;
  };
  uptimeSeconds: number;
}

export interface ApiFieldError {
  path: string;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: ApiFieldError[] | unknown;
    stack?: string;
  };
}

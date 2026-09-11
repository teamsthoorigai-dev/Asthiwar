import { apiClient, apiClientEnvelope, RequestOptions, Paginated } from './client';

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export interface AdminLoginResponse {
  user: AdminUser;
  token?: string;
}

export interface DashboardAnalytics {
  kpis?: {
    totalEstimates: number;
    totalPipelineValue: number;
    avgProjectValue: number;
    avgBuiltupArea: number;
    totalEnquiries: number;
    newEnquiriesCount: number;
    closedWonCount: number;
    conversionRate: number;
  };
  metrics?: {
    totalEstimates: number;
    totalPipelineValue: number;
    avgProjectValue: number;
    avgBuiltupArea: number;
    totalEnquiries: number;
    newEnquiriesCount: number;
    closedWonCount: number;
    conversionRate: number;
  };
  enquiriesByStatus?: Record<string, number>;
  estimatesByPackage: Array<{
    packageSlug: string;
    count: number;
    totalValue: number;
  }>;
  estimatesByLocation?: Array<{
    location: string;
    count: number;
    totalValue: number;
  }>;
  recentEstimates?: Array<{
    id: string;
    estimateNumber: string;
    customerName: string;
    customerPhone: string;
    packageSlug: string;
    plotLocation: string;
    totalProjectCost: string | number;
    createdAt: string;
    status: string;
  }>;
  recentEnquiries: Array<{
    id: string | number;
    fullName: string;
    phone: string;
    email: string | null;
    plotLocation: string;
    estimateNumber: string | null;
    status: string;
    priority?: string;
    createdAt: string;
  }>;
}

export type EnquiryStatus = 'NEW' | 'CONTACTED' | 'MEETING_SCHEDULED' | 'QUOTATION_SENT' | 'CLOSED_WON' | 'CLOSED_LOST';
export type EnquiryPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface AdminEnquiry {
  id: string;
  estimateId: string | null;
  estimateNumber: string | null;
  fullName: string;
  phone: string;
  email: string | null;
  plotLocation: string;
  preferredContactTime: string | null;
  requirementNotes: string | null;
  status: EnquiryStatus;
  priority: EnquiryPriority;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  // Estimate summary joined by backend
  estimateTotalCost?: string | number | null;
  estimatePackageSlug?: string | null;
  estimateBuiltupArea?: string | number | null;
  estimate?: AdminEstimateDetail | null;
}

export type EstimateStatus = 'DRAFT' | 'GENERATED' | 'DOWNLOADED' | 'SENT';

export interface AdminEstimate {
  id: string;
  estimateNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  plotLocation: string;
  packageSlug: string;
  packageRatePerSqft: number | string;
  totalBuiltupAreaSqft: number | string;
  baseConstructionCost: number | string;
  upgradesCost: number | string;
  addonsCost: number | string;
  subtotalCost: number | string;
  totalProjectCost: number | string;
  status: EstimateStatus;
  pdfUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminEstimateItem {
  id: number;
  estimateId: string;
  itemId: number;
  itemSlug: string;
  itemName: string;
  selectedOptionId: number;
  selectedOptionName: string;
  unitPriceDelta: string | number;
  calculatedPrice: string | number;
  createdAt: string;
}

export interface AdminEstimateAddon {
  id: number;
  estimateId: string;
  addonId: number;
  addonSlug: string;
  addonName: string;
  selectedVariant: string;
  quantity: string | number;
  unit: string;
  unitPrice: string | number;
  totalPrice: string | number;
  createdAt: string;
}

export interface AdminEstimateDetail extends AdminEstimate {
  locationId?: number | null;
  locationMultiplier?: string | number;
  plotAreaSqft?: string | number;
  plotAreaUnit?: string;
  builtupAreaPerFloorSqft?: string | number;
  floorCount?: string;
  numberOfFloors?: number;
  floorBreakdownJson?: any;
  carParkingAreaSqft?: string | number;
  carCount?: number;
  gstPercentage?: string | number;
  gstAmount?: string | number;
  milestoneBreakdownJson?: any;
  fullSnapshotJson?: any;
  items?: AdminEstimateItem[];
  addons?: AdminEstimateAddon[];
}

/** Pricing units the calculator knows how to render and multiply. */
export const ADDON_PRICING_UNITS = [
  'fixed',
  'per_litre',
  'per_rft',
  'per_sqft',
  'per_sqft_gate',
  'per_sqft_terrace',
] as const;
export type AddonPricingUnitKey = (typeof ADDON_PRICING_UNITS)[number];

/**
 * `addon_prices.package_tier` holds one of: 'all', a CSV of package slugs
 * ('basic,premium'), or a legacy group name from the original seed. This mirrors
 * backend/src/services/addon-tiers.ts — keep the two in step.
 */
const LEGACY_TIER_GROUPS: Record<string, string[]> = {
  basic_standard: ['basic', 'standard'],
  premium_luxury: ['premium', 'luxury'],
};

/** Package slugs a stored tier value covers. `'all'` needs the full roster. */
export function expandPackageTier(packageTier: string, allPackageSlugs: string[]): string[] {
  const raw = (packageTier ?? '').trim();
  if (!raw || raw === 'all') return [...allPackageSlugs];
  if (LEGACY_TIER_GROUPS[raw]) return [...LEGACY_TIER_GROUPS[raw]];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Units a specification component's rate delta can be expressed in. */
export const ITEM_UNITS = ['sqft', 'rft', 'fixed', 'item', 'allowance'] as const;
export type ItemUnit = (typeof ITEM_UNITS)[number];

export interface AddonVariantPayload {
  variantName: string;
  variantSlug: string;
  price: number;
  /** Package slugs the variant is offered in. At least one. */
  packageTiers: string[];
}

export interface BrandOption {
  id: number;
  itemId: number;
  slug: string;
  brandName: string;
  specification: string | null;
  isDefault: boolean;
  prices?: Array<{
    id: number;
    optionId: number;
    packageId: number | null;
    priceDelta: string;
    priceType: string;
    // null = still in force. Retired rows are returned too, as history.
    effectiveTo?: string | null;
  }>;
  activePrice?: {
    id: number;
    optionId: number;
    priceDelta: string;
    priceType: string;
  } | null;
}

export interface AdminSpecificationItem {
  id: number;
  categoryId: number;
  slug: string;
  name: string;
  description: string | null;
  unit: string;
  isCustomizable: boolean;
  sortOrder: number;
  options: BrandOption[];
  packageMappings: Array<{
    id: number;
    packageId: number;
    itemId: number;
    defaultOptionId: number | null;
    includedCoverage: string | null;
    isIncluded: boolean;
    additionalCostPrice: string;
  }>;
}

export interface AdminSpecificationCategory {
  id: number;
  slug: string;
  name: string;
  sortOrder: number;
  items: AdminSpecificationItem[];
}

export interface PricingConfigData {
  packages: Array<{
    id: number;
    slug: string;
    name: string;
    tagline?: string | null;
    description?: string | null;
    highlights?: string[];
    isRecommended?: boolean;
    colorTheme?: string | null;
    isActive?: boolean;
    sortOrder?: number;
    activePrice?: {
      id: number;
      packageId: number;
      pricePerSqft: string;
      volumePricePerSqft: string;
      volumeDiscountThresholdSqft: number;
      headRoomPricePerSqft: string;
      effectiveFrom: string;
      effectiveTo: string | null;
    } | null;
  }>;
  locations: Array<{
    id: number;
    name: string;
    slug: string;
    priceMultiplier: number | string;
    isActive?: boolean;
    sortOrder?: number;
  }>;
  categories: AdminSpecificationCategory[];
  addons: Array<{
    id: number;
    name: string;
    slug: string;
    description: string | null;
    pricingUnit: string;
    defaultQuantity?: string;
    minQuantity?: string;
    maxQuantity?: string;
    sortOrder?: number;
    isActive?: boolean;
    activePrices: Array<{
      id: number;
      addonId: number;
      variantName: string;
      variantSlug: string;
      packageTier: string;
      price: string;
      effectiveFrom: string;
      effectiveTo: string | null;
    }>;
  }>;
  milestones: Array<{
    id?: number;
    stageNumber: number;
    stageName: string;
    percentage: string | number;
    keyDeliverables: string;
    isActive?: boolean;
  }>;
}

// ----------------------------------------------------
// AUTHENTICATION
// ----------------------------------------------------

export async function adminLogin(
  payload: { email: string; password: string },
  options?: RequestOptions
): Promise<AdminLoginResponse> {
  return apiClient<AdminLoginResponse>('/api/v1/admin/auth/login', {
    method: 'POST',
    body: payload,
    ...options,
  });
}

export async function adminGetMe(options?: RequestOptions): Promise<AdminUser> {
  const res = await apiClient<{ user: AdminUser }>('/api/v1/admin/auth/me', {
    method: 'GET',
    ...options,
  });
  return res.user;
}

export async function adminLogout(
  options?: RequestOptions
): Promise<{ message: string }> {
  return apiClient<{ message: string }>('/api/v1/admin/auth/logout', {
    method: 'POST',
    ...options,
  });
}

// ----------------------------------------------------
// ANALYTICS & DASHBOARD
// ----------------------------------------------------

export async function getDashboardAnalytics(
  options?: RequestOptions
): Promise<DashboardAnalytics> {
  return apiClient<DashboardAnalytics>('/api/v1/admin/analytics/dashboard', {
    method: 'GET',
    ...options,
  });
}

// ----------------------------------------------------
// ENQUIRIES
// ----------------------------------------------------

export async function getAdminEnquiries(
  params?: {
    status?: string;
    priority?: string;
    plotLocation?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  },
  options?: RequestOptions
): Promise<Paginated<AdminEnquiry[]>> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.priority) query.set('priority', params.priority);
  if (params?.plotLocation) query.set('plotLocation', params.plotLocation);
  if (params?.search) query.set('search', params.search);
  if (params?.sortBy) query.set('sortBy', params.sortBy);
  if (params?.sortOrder) query.set('sortOrder', params.sortOrder);
  if (params?.page) query.set('page', params.page.toString());
  if (params?.limit) query.set('limit', params.limit.toString());

  const qStr = query.toString();
  return apiClientEnvelope<AdminEnquiry[]>(
    `/api/v1/admin/enquiries${qStr ? `?${qStr}` : ''}`,
    {
      method: 'GET',
      ...options,
    }
  );
}

export async function getAdminEnquiryById(
  id: string,
  options?: RequestOptions
): Promise<AdminEnquiry> {
  return apiClient<AdminEnquiry>(`/api/v1/admin/enquiries/${id}`, {
    method: 'GET',
    ...options,
  });
}

export async function updateAdminEnquiry(
  id: string | number,
  payload: {
    status?: EnquiryStatus;
    priority?: EnquiryPriority;
    adminNotes?: string;
  },
  options?: RequestOptions
): Promise<AdminEnquiry> {
  return apiClient<AdminEnquiry>(`/api/v1/admin/enquiries/${id}`, {
    method: 'PATCH',
    body: payload,
    ...options,
  });
}

export async function sendLeadNotification(
  id: string,
  options?: RequestOptions
): Promise<{ success: boolean; message: string }> {
  return apiClient<{ success: boolean; message: string }>(`/api/v1/admin/enquiries/${id}/notify`, {
    method: 'POST',
    ...options,
  });
}

// ----------------------------------------------------
// ESTIMATES
// ----------------------------------------------------

export async function getAdminEstimates(
  params?: {
    search?: string;
    status?: string;
    packageSlug?: string;
    locationId?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  },
  options?: RequestOptions
): Promise<Paginated<AdminEstimate[]>> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.status) query.set('status', params.status);
  if (params?.packageSlug) query.set('packageSlug', params.packageSlug);
  if (params?.locationId) query.set('locationId', params.locationId.toString());
  if (params?.sortBy) query.set('sortBy', params.sortBy);
  if (params?.sortOrder) query.set('sortOrder', params.sortOrder);
  if (params?.page) query.set('page', params.page.toString());
  if (params?.limit) query.set('limit', params.limit.toString());

  const qStr = query.toString();
  return apiClientEnvelope<AdminEstimate[]>(
    `/api/v1/admin/estimates${qStr ? `?${qStr}` : ''}`,
    {
      method: 'GET',
      ...options,
    }
  );
}

export async function getAdminEstimateById(
  id: string,
  options?: RequestOptions
): Promise<AdminEstimateDetail> {
  return apiClient<AdminEstimateDetail>(`/api/v1/admin/estimates/${id}`, {
    method: 'GET',
    ...options,
  });
}

export async function updateAdminEstimate(
  id: string,
  payload: {
    status?: EstimateStatus;
    pdfUrl?: string | null;
  },
  options?: RequestOptions
): Promise<AdminEstimate> {
  return apiClient<AdminEstimate>(`/api/v1/admin/estimates/${id}`, {
    method: 'PATCH',
    body: payload,
    ...options,
  });
}

export async function sendEstimateNotification(
  id: string,
  channels: Array<'EMAIL' | 'WHATSAPP'> = ['EMAIL', 'WHATSAPP'],
  options?: RequestOptions
): Promise<{ success: boolean; message: string; data: any }> {
  return apiClient<{ success: boolean; message: string; data: any }>(
    `/api/v1/admin/estimates/${id}/notify`,
    {
      method: 'POST',
      body: { channels },
      ...options,
    }
  );
}

// ----------------------------------------------------
// PRICING & SPECIFICATIONS CONFIGURATION
// ----------------------------------------------------

export async function getAdminPricingConfig(
  options?: RequestOptions
): Promise<PricingConfigData> {
  const [pkgs, locs, addons, specs, milestones] = await Promise.all([
    apiClient<any[]>('/api/v1/admin/config/packages', options),
    apiClient<any[]>('/api/v1/admin/config/locations', options),
    apiClient<any[]>('/api/v1/admin/config/addons', options),
    apiClient<any[]>('/api/v1/admin/config/specifications', options),
    apiClient<any[]>('/api/v1/admin/config/milestones', options),
  ]);

  return {
    packages: pkgs,
    locations: locs,
    addons: addons,
    categories: specs,
    milestones: milestones,
  };
}

export async function updatePackagePricing(
  packageId: number,
  payload: {
    pricePerSqft?: number;
    volumePricePerSqft?: number;
    volumeDiscountThresholdSqft?: number;
    headRoomPricePerSqft?: number;
  },
  options?: RequestOptions
): Promise<{ success: boolean; message?: string }> {
  return apiClient<{ success: boolean; message?: string }>(
    `/api/v1/admin/config/packages/${packageId}/price`,
    {
      method: 'PUT',
      body: payload,
      ...options,
    }
  );
}

export async function updatePackageMetadata(
  packageId: number,
  payload: {
    name?: string;
    tagline?: string;
    description?: string;
    highlights?: string[];
    isRecommended?: boolean;
    colorTheme?: string;
    isActive?: boolean;
    sortOrder?: number;
  },
  options?: RequestOptions
): Promise<{ success: boolean; message?: string }> {
  return apiClient<{ success: boolean; message?: string }>(
    `/api/v1/admin/config/packages/${packageId}`,
    {
      method: 'PATCH',
      body: payload,
      ...options,
    }
  );
}

export async function updateLocationMultiplier(
  locationId: number,
  payload: { priceMultiplier: number; name?: string; isActive?: boolean },
  options?: RequestOptions
): Promise<{ success: boolean }> {
  return apiClient<{ success: boolean }>(
    `/api/v1/admin/config/locations/${locationId}`,
    {
      method: 'PATCH',
      body: payload,
      ...options,
    }
  );
}

export async function createLocation(
  payload: { name: string; slug: string; priceMultiplier: number; sortOrder?: number; isActive?: boolean },
  options?: RequestOptions
): Promise<{ success: boolean; data: any }> {
  return apiClient<{ success: boolean; data: any }>(
    '/api/v1/admin/config/locations',
    {
      method: 'POST',
      body: payload,
      ...options,
    }
  );
}

export async function deleteLocation(
  locationId: number,
  options?: RequestOptions
): Promise<{ success: boolean; message: string }> {
  return apiClient<{ success: boolean; message: string }>(
    `/api/v1/admin/config/locations/${locationId}`,
    {
      method: 'DELETE',
      ...options,
    }
  );
}

export async function updateAddonVariantPricing(
  addonId: number,
  payload: { variantSlug: string; price: number },
  options?: RequestOptions
): Promise<{ success: boolean; message?: string }> {
  return apiClient<{ success: boolean; message?: string }>(
    `/api/v1/admin/config/addons/${addonId}/price`,
    {
      method: 'PUT',
      body: payload,
      ...options,
    }
  );
}

export async function updateAddonMetadata(
  addonId: number,
  payload: {
    name?: string;
    description?: string;
    pricingUnit?: AddonPricingUnitKey;
    defaultQuantity?: number | null;
    minQuantity?: number | null;
    maxQuantity?: number | null;
    isActive?: boolean;
    sortOrder?: number;
  },
  options?: RequestOptions
): Promise<{ success: boolean; message?: string }> {
  return apiClient<{ success: boolean; message?: string }>(
    `/api/v1/admin/config/addons/${addonId}`,
    {
      method: 'PATCH',
      body: payload,
      ...options,
    }
  );
}

export async function createOption(
  payload: {
    itemId: number;
    name: string;
    slug: string;
    description?: string;
    priceDelta: number;
  },
  options?: RequestOptions
): Promise<{ success: boolean; data: any }> {
  return apiClient<{ success: boolean; data: any }>(
    '/api/v1/admin/config/options',
    {
      method: 'POST',
      body: payload,
      ...options,
    }
  );
}

export async function updateOptionPricing(
  optionId: number,
  payload: { priceDelta?: number; name?: string; slug?: string; description?: string | null },
  options?: RequestOptions
): Promise<{ success: boolean; message?: string }> {
  return apiClient<{ success: boolean; message?: string }>(
    `/api/v1/admin/config/options/${optionId}/price`,
    {
      method: 'PUT',
      body: payload,
      ...options,
    }
  );
}

export async function deleteOption(
  optionId: number,
  options?: RequestOptions
): Promise<{ success: boolean; message: string }> {
  return apiClient<{ success: boolean; message: string }>(
    `/api/v1/admin/config/options/${optionId}`,
    {
      method: 'DELETE',
      ...options,
    }
  );
}

export async function createAddon(
  payload: {
    name: string;
    slug: string;
    description?: string;
    pricingUnit: AddonPricingUnitKey;
    defaultQuantity?: number;
    minQuantity?: number;
    maxQuantity?: number;
    sortOrder?: number;
    isActive?: boolean;
    variants: AddonVariantPayload[];
  },
  options?: RequestOptions
): Promise<{ success: boolean; data: unknown }> {
  return apiClient<{ success: boolean; data: unknown }>('/api/v1/admin/config/addons', {
    method: 'POST',
    body: payload,
    ...options,
  });
}

export async function deleteAddon(
  addonId: number,
  options?: RequestOptions
): Promise<{ success: boolean; message: string }> {
  return apiClient<{ success: boolean; message: string }>(
    `/api/v1/admin/config/addons/${addonId}`,
    {
      method: 'DELETE',
      ...options,
    }
  );
}

export async function createAddonVariant(
  addonId: number,
  payload: AddonVariantPayload,
  options?: RequestOptions
): Promise<{ success: boolean; data: unknown }> {
  return apiClient<{ success: boolean; data: unknown }>(
    `/api/v1/admin/config/addons/${addonId}/variants`,
    {
      method: 'POST',
      body: payload,
      ...options,
    }
  );
}

export async function deleteAddonVariant(
  addonId: number,
  variantId: number,
  options?: RequestOptions
): Promise<{ success: boolean; message: string }> {
  return apiClient<{ success: boolean; message: string }>(
    `/api/v1/admin/config/addons/${addonId}/variants/${variantId}`,
    {
      method: 'DELETE',
      ...options,
    }
  );
}

export async function createCategory(
  payload: { name: string; slug: string; sortOrder?: number },
  options?: RequestOptions
): Promise<{ success: boolean; data: unknown }> {
  return apiClient<{ success: boolean; data: unknown }>('/api/v1/admin/config/categories', {
    method: 'POST',
    body: payload,
    ...options,
  });
}

export async function updateCategory(
  categoryId: number,
  payload: { name?: string; slug?: string; sortOrder?: number },
  options?: RequestOptions
): Promise<{ success: boolean; data: unknown }> {
  return apiClient<{ success: boolean; data: unknown }>(
    `/api/v1/admin/config/categories/${categoryId}`,
    {
      method: 'PATCH',
      body: payload,
      ...options,
    }
  );
}

export async function deleteCategory(
  categoryId: number,
  options?: RequestOptions
): Promise<{ success: boolean; message: string }> {
  return apiClient<{ success: boolean; message: string }>(
    `/api/v1/admin/config/categories/${categoryId}`,
    {
      method: 'DELETE',
      ...options,
    }
  );
}

export async function createItem(
  payload: {
    categoryId: number;
    name: string;
    slug: string;
    description?: string;
    unit?: ItemUnit;
    isCustomizable?: boolean;
    sortOrder?: number;
  },
  options?: RequestOptions
): Promise<{ success: boolean; data: unknown }> {
  return apiClient<{ success: boolean; data: unknown }>('/api/v1/admin/config/items', {
    method: 'POST',
    body: payload,
    ...options,
  });
}

export async function updateItem(
  itemId: number,
  payload: {
    categoryId?: number;
    name?: string;
    slug?: string;
    description?: string | null;
    unit?: ItemUnit;
    isCustomizable?: boolean;
    sortOrder?: number;
  },
  options?: RequestOptions
): Promise<{ success: boolean; data: unknown }> {
  return apiClient<{ success: boolean; data: unknown }>(`/api/v1/admin/config/items/${itemId}`, {
    method: 'PATCH',
    body: payload,
    ...options,
  });
}

export async function deleteItem(
  itemId: number,
  options?: RequestOptions
): Promise<{ success: boolean; message: string }> {
  return apiClient<{ success: boolean; message: string }>(
    `/api/v1/admin/config/items/${itemId}`,
    {
      method: 'DELETE',
      ...options,
    }
  );
}

export async function updatePackageItem(
  packageItemId: number,
  payload: {
    isIncluded?: boolean;
    additionalCostPrice?: number;
    includedCoverage?: string;
    defaultOptionId?: number | null;
  },
  options?: RequestOptions
): Promise<{ success: boolean; data: any }> {
  return apiClient<{ success: boolean; data: any }>(
    `/api/v1/admin/config/package-items/${packageItemId}`,
    {
      method: 'PATCH',
      body: payload,
      ...options,
    }
  );
}

export async function updateMilestones(
  payload: {
    milestones: Array<{
      id?: number;
      stageNumber: number;
      stageName: string;
      percentage: number;
      keyDeliverables: string;
      isActive?: boolean;
    }>;
  },
  options?: RequestOptions
): Promise<{ success: boolean; message?: string }> {
  return apiClient<{ success: boolean; message?: string }>(
    '/api/v1/admin/config/milestones',
    {
      method: 'PUT',
      body: payload,
      ...options,
    }
  );
}

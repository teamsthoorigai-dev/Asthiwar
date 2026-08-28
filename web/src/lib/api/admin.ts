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
    totalEnquiries: number;
    newEnquiriesCount: number;
    totalPipelineValue: number;
    avgProjectValue: number;
  };
  metrics?: {
    totalEstimates: number;
    totalEnquiries: number;
    newEnquiriesCount: number;
    totalPipelineValue: number;
    averageEstimateValue: number;
  };
  recentEnquiries: Array<{
    id: string | number;
    fullName: string;
    phone: string;
    email: string;
    plotLocation: string;
    estimateNumber: string | null;
    status: string;
    priority: string;
    createdAt: string;
  }>;
  estimatesByPackage: Array<{
    packageSlug: string;
    count: number;
    totalValue: number;
  }>;
}

export interface AdminEnquiry {
  id: string | number;
  fullName: string;
  phone: string;
  email: string;
  plotLocation: string;
  estimateNumber: string | null;
  status: 'new' | 'contacted' | 'site_visit_scheduled' | 'converted' | 'lost';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  preferredContactTime: string | null;
  requirementNotes: string | null;
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminEstimate {
  id: string;
  estimateNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  plotLocation: string;
  packageSlug: string;
  totalBuiltupAreaSqft: number;
  totalProjectCost: number;
  effectiveRatePerSqft: number;
  hasEnquiry: boolean;
  createdAt: string;
}

export interface PricingConfigData {
  // Mirrors GET /api/v1/admin/config/packages. Rates live under `activePrice`
  // (the current row of the append-only price history), NOT on the package root.
  packages: Array<{
    id: number;
    slug: string;
    name: string;
    tagline?: string | null;
    description?: string | null;
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
    priceMultiplier: number;
  }>;
  categories: Array<{
    id: number;
    name: string;
    slug: string;
    items: Array<{
      id: number;
      name: string;
      slug: string;
      isCustomizable: boolean;
      options: Array<{
        id: number;
        slug: string;
        brandName: string;
        priceDelta: number;
        isPackageDefault: boolean;
      }>;
    }>;
  }>;
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
    allPriceHistory?: Array<{
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

export async function updateAdminEnquiry(
  id: string | number,
  payload: {
    status?: string;
    priority?: string;
    internalNotes?: string;
  },
  options?: RequestOptions
): Promise<AdminEnquiry> {
  return apiClient<AdminEnquiry>(`/api/v1/admin/enquiries/${id}`, {
    method: 'PATCH',
    body: payload,
    ...options,
  });
}

// ----------------------------------------------------
// ESTIMATES
// ----------------------------------------------------

export async function getAdminEstimates(
  params?: {
    search?: string;
    packageSlug?: string;
    page?: number;
    limit?: number;
  },
  options?: RequestOptions
): Promise<Paginated<AdminEstimate[]>> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.packageSlug) query.set('packageSlug', params.packageSlug);
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

// ----------------------------------------------------
// PRICING CONFIGURATION
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
): Promise<{ success: boolean }> {
  return apiClient<{ success: boolean }>(
    `/api/v1/admin/config/packages/${packageId}/price`,
    {
      method: 'PUT',
      body: payload,
      ...options,
    }
  );
}

export async function updateLocationMultiplier(
  locationId: number,
  payload: { priceMultiplier: number },
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

export async function updateOptionPricing(
  optionId: number,
  payload: { priceDelta: number },
  options?: RequestOptions
): Promise<{ success: boolean }> {
  return apiClient<{ success: boolean }>(
    `/api/v1/admin/config/options/${optionId}/price`,
    {
      method: 'PUT',
      body: payload,
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

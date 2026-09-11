import { apiClient, getApiBaseUrl, RequestOptions } from './client';
import {
  LocationItem,
  PackageItem,
  PackageConfigResponse,
  CalculatorInput,
  CalculationResult,
  HealthResponse,
} from './types';

/**
 * GET /api/v1/calculator/locations
 * Fetches active cities and regional pricing multipliers
 */
export async function getLocations(options?: RequestOptions): Promise<LocationItem[]> {
  return apiClient<LocationItem[]>('/api/v1/calculator/locations', {
    method: 'GET',
    ...options,
  });
}

/**
 * GET /api/v1/calculator/packages
 * Fetches the 4 construction packages with active standard and volume rates
 */
export async function getPackages(options?: RequestOptions): Promise<PackageItem[]> {
  return apiClient<PackageItem[]>('/api/v1/calculator/packages', {
    method: 'GET',
    ...options,
  });
}

/**
 * GET /api/v1/calculator/config/:packageSlug
 * Fetches specification item categories and 15 add-ons configured for a package tier
 */
export async function getPackageConfig(
  packageSlug: string,
  options?: RequestOptions
): Promise<PackageConfigResponse> {
  return apiClient<PackageConfigResponse>(
    `/api/v1/calculator/config/${encodeURIComponent(packageSlug)}`,
    {
      method: 'GET',
      ...options,
    }
  );
}

/**
 * GET /api/v1/calculator/matrix
 * Fetches authoritative 4-tier specification comparison matrix from database
 */
export async function getComparisonMatrix(
  options?: RequestOptions
): Promise<import('../calculator/types').ComparisonMatrixItem[]> {
  return apiClient<import('../calculator/types').ComparisonMatrixItem[]>(
    '/api/v1/calculator/matrix',
    {
      method: 'GET',
      ...options,
    }
  );
}

/**
 * POST /api/v1/calculator/preview
 * Calculates estimate on-the-fly WITHOUT writing to database
 */
export async function previewEstimate(
  input: CalculatorInput,
  options?: RequestOptions
): Promise<CalculationResult> {
  return apiClient<CalculationResult>('/api/v1/calculator/preview', {
    method: 'POST',
    body: input,
    ...options,
  });
}

/**
 * POST /api/v1/calculator/estimate
 * Authoritative calculation + immutable PostgreSQL snapshot persistence
 * (No automatic retries allowed)
 */
export async function createEstimate(
  input: CalculatorInput,
  options?: RequestOptions
): Promise<CalculationResult> {
  return apiClient<CalculationResult>('/api/v1/calculator/estimate', {
    method: 'POST',
    body: input,
    ...options,
  });
}

/**
 * GET /api/v1/calculator/estimate/:estimateNumber
 * Fetches historical immutable calculation snapshot by estimate identifier
 */
export async function getEstimateByNumber(
  estimateNumber: string,
  options?: RequestOptions
): Promise<CalculationResult> {
  return apiClient<CalculationResult>(
    `/api/v1/calculator/estimate/${encodeURIComponent(estimateNumber)}`,
    {
      method: 'GET',
      ...options,
    }
  );
}

/**
 * The URL-safe spelling of a quotation number: AW/2026/O/0001 -> AW-2026-O-0001.
 *
 * Mirrors urlSafeQuotationNumber in backend/src/modules/calculator/quotation.ts;
 * the lookup there resolves either spelling back to the stored value. Percent
 * encoding also works, but a quotation link gets pasted into WhatsApp, email and
 * address bars, where %2F is fragile and unreadable — so links use the dash form.
 */
export function urlSafeEstimateNumber(estimateNumber: string): string {
  return estimateNumber.replace(/\//g, '-');
}

/**
 * A customer's own quotation PDF link.
 *
 * The quotation number is a sequence, so it identifies the document but does not
 * authorise reading it — the access token issued with the estimate does. A link
 * built without one 404s, which is the point: it is what stops a stranger
 * counting up the sequence and collecting every customer's PDF.
 */
export function getEstimatePdfUrl(estimateNumber: string, accessToken: string): string {
  const baseUrl = getApiBaseUrl();
  return (
    `${baseUrl}/api/v1/calculator/estimate/${urlSafeEstimateNumber(estimateNumber)}/pdf` +
    `?t=${encodeURIComponent(accessToken)}`
  );
}

/**
 * The same PDF for an operator in the admin console.
 *
 * Goes through the authenticated admin route, so it needs no access token — the
 * session is the authorisation. The console previously linked to the public
 * route, which now refuses a request that carries no token; it also meant staff
 * links were shareable with anyone.
 *
 * Accepts an estimate id or a quotation number.
 */
export function getAdminEstimatePdfUrl(estimateIdOrNumber: string): string {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}/api/v1/admin/estimates/${urlSafeEstimateNumber(estimateIdOrNumber)}/pdf`;
}

/**
 * GET /api/v1/health
 * Probes backend server and database connectivity status
 */
export async function getHealth(options?: RequestOptions): Promise<HealthResponse> {
  return apiClient<HealthResponse>('/api/v1/health', {
    method: 'GET',
    ...options,
  });
}

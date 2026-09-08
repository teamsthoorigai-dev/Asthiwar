import { env } from '../env';
import { ApiFieldError } from './types';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: ApiFieldError[] | unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
}

export function getApiBaseUrl(): string {
  return typeof window === 'undefined'
    ? env.API_BASE_URL_INTERNAL
    : env.NEXT_PUBLIC_API_BASE_URL;
}

/**
 * Paged list responses put `pagination` as a SIBLING of `data`:
 *   { success: true, data: [...], pagination: { page, limit, total, totalPages } }
 * `apiClient` unwraps to `data` and therefore drops it. Use `apiClientEnvelope`
 * when the caller needs the metadata too.
 */
export interface Paginated<T> {
  items: T;
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}

/** Full parsed response body, envelope intact. */
export async function apiClientEnvelope<T>(
  path: string,
  options: RequestOptions = {}
): Promise<Paginated<T>> {
  const body = await apiRequest<Record<string, unknown>>(path, options);
  if (body && typeof body === 'object' && 'data' in body) {
    return {
      items: body.data as T,
      pagination: body.pagination as Paginated<T>['pagination'],
    };
  }
  return { items: body as unknown as T };
}

export async function apiClient<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const responseData = await apiRequest<any>(path, options);

  // Handle envelope { success: true, data: T } vs bare response object
  if (
    responseData &&
    typeof responseData === 'object' &&
    'success' in responseData &&
    'data' in responseData &&
    responseData.success === true
  ) {
    return responseData.data as T;
  }

  return responseData as T;
}

/** Shared transport: URL building, headers, credentials, error mapping. */
async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  let urlString = `${baseUrl}${normalizedPath}`;
  if (options.params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(options.params)) {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    }
    const query = searchParams.toString();
    if (query) {
      urlString += (urlString.includes('?') ? '&' : '?') + query;
    }
  }

  const { body, headers, ...restOptions } = options;

  const requestHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(headers as Record<string, string>),
  };

  let serializedBody: string | undefined;
  if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json';
    serializedBody = JSON.stringify(body);
  }

  const response = await fetch(urlString, {
    credentials: 'include',
    headers: requestHeaders,
    body: serializedBody,
    ...restOptions,
  });

  let responseData: any;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    responseData = await response.json().catch(() => null);
  } else {
    responseData = await response.text().catch(() => null);
  }

  if (!response.ok) {
    const errorObj = responseData?.error;
    const errorCode = errorObj?.code || responseData?.status || `HTTP_${response.status}`;
    const errorMessage =
      errorObj?.message ||
      responseData?.database?.message ||
      responseData?.message ||
      (typeof responseData === 'string' && responseData.trim()) ||
      response.statusText ||
      `Request failed with status ${response.status}`;
    const errorDetails = errorObj?.details;

    throw new ApiError(response.status, String(errorCode), errorMessage, errorDetails);
  }

  return responseData as T;
}

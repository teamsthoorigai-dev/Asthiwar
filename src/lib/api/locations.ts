import { getApiBaseUrl } from './client';
import type { LocationItem } from '@/lib/calculator/types';

/**
 * The cities the business actually serves, read from the catalogue.
 *
 * The homepage used to render a hand-written list in src/data/pricing.ts, which
 * had already drifted from the database it was meant to mirror: it advertised
 * Salem, which is not in the catalogue and which the calculator cannot price; it
 * omitted Virudhunagar and Other TN, which are served; and it carried Tiruppur
 * and Erode at 1.00 where the live multipliers are 0.98. Adding a city in the
 * admin console changed the calculator and never reached the site.
 *
 * Fetched on the server so the pills and the enquiry dropdown are in the HTML for
 * crawlers, and revalidated rather than fetched per request — the city list
 * changes about as often as a new branch opens.
 */
export async function getLocationsForSite(): Promise<LocationItem[]> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/calculator/locations`, {
      next: { revalidate: 300 },
    });

    if (!res.ok) return [];

    const body = (await res.json()) as { data?: LocationItem[] };
    return Array.isArray(body.data) ? body.data : [];
  } catch {
    // A homepage must render when the API is down. Callers are written to cope
    // with an empty list rather than fall back to a second, stale copy of the
    // catalogue — one wrong list is worse than none, because it looks right.
    return [];
  }
}

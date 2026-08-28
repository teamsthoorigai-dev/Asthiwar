import type { AreaUnit } from './types';

/**
 * Display-only conversion helper for client UI feedback.
 *
 * NOTE: This is strictly for user interface estimation hints in input forms.
 * The backend calculation engine in `calculator.service.ts` remains the single
 * authoritative source of truth for all unit conversions and project pricing.
 * Rule #5: No money is computed here.
 */
export function convertAreaToDisplaySqft(area: number, unit: AreaUnit = 'sqft'): number {
  if (!area || area <= 0) return 0;
  switch (unit) {
    case 'cents':
      return Math.round(area * 435.6);
    case 'sqyards':
      return Math.round(area * 9);
    case 'sqm':
      return Math.round(area * 10.764);
    case 'sqft':
    default:
      return Math.round(area);
  }
}

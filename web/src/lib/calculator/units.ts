import type { AreaUnit } from './types';

/**
 * Display-only conversion helpers for client UI feedback.
 *
 * NOTE: These are strictly for user interface estimation hints in input forms.
 * The backend calculation engine in `calculator.service.ts` remains the single
 * authoritative source of truth for all unit conversions and project pricing.
 * Rule #5: No money is computed here.
 */

/** 1 cent = 435.6 sq.ft — the same factor the engine uses. */
export const SQFT_PER_CENT = 435.6;

export function convertAreaToDisplaySqft(area: number, unit: AreaUnit = 'sqft'): number {
  if (!area || area <= 0) return 0;
  switch (unit) {
    case 'cents':
      return Math.round(area * SQFT_PER_CENT);
    case 'sqyards':
      return Math.round(area * 9);
    case 'sqm':
      return Math.round(area * 10.764);
    case 'sqft':
    default:
      return Math.round(area);
  }
}

/** Sq.ft → cents, to two decimals. Land in Tamil Nadu is commonly quoted in cents. */
export function convertSqftToCents(areaSqft: number): number {
  if (!areaSqft || areaSqft <= 0) return 0;
  return Math.round((areaSqft / SQFT_PER_CENT) * 100) / 100;
}

/**
 * The conversions worth showing next to a plot-area input, excluding whatever
 * unit was typed. Returns an empty array when there is nothing useful to add.
 */
export function plotAreaConversions(area: number, unit: AreaUnit): string[] {
  const sqft = convertAreaToDisplaySqft(area, unit);
  if (sqft <= 0) return [];

  const parts: string[] = [];
  if (unit !== 'sqft') {
    parts.push(`${sqft.toLocaleString('en-IN')} Sq.Ft`);
  }
  if (unit !== 'cents') {
    parts.push(`${convertSqftToCents(sqft).toLocaleString('en-IN')} Cents`);
  }
  return parts;
}

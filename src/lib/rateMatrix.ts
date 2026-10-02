/**
 * A component's brand rates across package tiers.
 *
 * Every figure in the specification matrix answers one question: what does a
 * customer on package P pay to switch to brand B? Each tier includes one brand
 * at no charge, so every switch has a mirror: Basic (incl. ISI) charges +₹35 to
 * move up to Ultratech, and Luxury (incl. Ultratech) credits −₹35 to move down
 * to ISI. Both are the same swap seen from either end, so they are kept equal
 * and opposite:
 *
 *     rate(B, P) = −rate(included(P), Q)   where Q includes B
 *
 * Editing a rate updates its mirror and nothing else — no other tier is
 * re-priced. Amounts are whole paise throughout, so a mirrored figure never
 * carries float noise into a price.
 */

export type Paise = number;

/** A package tier as a matrix column. */
export interface MatrixColumn {
  packageId: number;
  /**
   * The brand this tier includes at no charge — the zero its rates are measured
   * from. Null when it includes none: such a column has nothing to be derived
   * from, and keeps whatever rates it is given.
   */
  includedOptionId: number | null;
}

export interface MatrixShape {
  optionIds: number[];
  columns: MatrixColumn[];
}

/** Rates in paise, keyed by `cellKey`. */
export type RateGrid = Record<string, Paise>;

/** One position per brand, in paise. Only the differences between positions mean anything. */
export type Ladder = Record<number, Paise>;

export interface RateChange {
  optionId: number;
  packageId: number;
  from: Paise;
  to: Paise;
}

export function cellKey(optionId: number, packageId: number): string {
  return `${optionId}:${packageId}`;
}

export function rateAt(grid: RateGrid, optionId: number, packageId: number): Paise {
  return grid[cellKey(optionId, packageId)] ?? 0;
}

export function toPaise(rupees: number): Paise {
  return Math.round(rupees * 100);
}

/** What an operator typed, in paise. Blank is zero; anything else must be a finite number. */
export function parseRupees(raw: string): Paise | null {
  const trimmed = raw.trim();
  if (trimmed === '') return 0;
  const value = Number(trimmed);
  return Number.isFinite(value) ? toPaise(value) : null;
}

/** Paise as an input value: '45.00', '-12.50'. */
export function formatRupees(paise: Paise): string {
  return (paise / 100).toFixed(2);
}

/** The brand a column is measured from, when it includes one of this component's brands. */
export function anchorOf(shape: MatrixShape, packageId: number): number | null {
  const anchor = shape.columns.find((column) => column.packageId === packageId)?.includedOptionId ?? null;
  return anchor !== null && shape.optionIds.includes(anchor) ? anchor : null;
}

/**
 * The ladder one column implies: each brand's rate there, measured from the
 * brand the column includes. Null for a column that includes none.
 */
export function ladderFromColumn(shape: MatrixShape, grid: RateGrid, packageId: number): Ladder | null {
  const anchor = anchorOf(shape, packageId);
  if (anchor === null) return null;

  const base = rateAt(grid, anchor, packageId);
  const ladder: Ladder = {};
  for (const optionId of shape.optionIds) {
    ladder[optionId] = rateAt(grid, optionId, packageId) - base;
  }
  return ladder;
}

/**
 * Each brand's position relative to the others, read from the first column
 * that includes a brand. Used to re-measure a column when the brand it
 * includes changes, so each brand keeps its gap to the others.
 */
export function currentLadder(shape: MatrixShape, grid: RateGrid): Ladder | null {
  for (const column of shape.columns) {
    const ladder = ladderFromColumn(shape, grid, column.packageId);
    if (ladder) return ladder;
  }
  return null;
}

/**
 * The cells that mirror (optionId, packageId): the brand `packageId` includes,
 * in each tier that includes `optionId`. Empty when the tier includes no brand
 * or includes this one (its rate there is fixed at zero), or when no tier
 * includes `optionId`.
 */
export function mirrorsOf(
  shape: MatrixShape,
  optionId: number,
  packageId: number
): Array<{ optionId: number; packageId: number }> {
  const anchor = anchorOf(shape, packageId);
  if (anchor === null || anchor === optionId) return [];
  return shape.columns
    .filter((column) => anchorOf(shape, column.packageId) === optionId)
    .map((column) => ({ optionId: anchor, packageId: column.packageId }));
}

/**
 * `typed` with each rate that differs from `before` mirrored: its mirror cell
 * becomes the same amount with the opposite sign. Every other cell is left as
 * it is in `typed`.
 */
export function withMirrors(shape: MatrixShape, before: RateGrid, typed: RateGrid): RateGrid {
  const next: RateGrid = { ...typed };
  for (const change of diffGrids(shape, before, typed)) {
    for (const mirror of mirrorsOf(shape, change.optionId, change.packageId)) {
      next[cellKey(mirror.optionId, mirror.packageId)] = change.to === 0 ? 0 : -change.to;
    }
  }
  return next;
}

/**
 * The matrix after `packageId` switches to including `optionId`: that column is
 * re-measured from the new brand, on the ladder the matrix already implies, so
 * each brand keeps its gap to every other. When no package includes a brand
 * yet, the column's own rates are the only ladder there is. Other columns are
 * unchanged. Null when `optionId` is not one of the component's brands.
 */
export function withIncludedBrand(
  shape: MatrixShape,
  grid: RateGrid,
  packageId: number,
  optionId: number
): { shape: MatrixShape; grid: RateGrid } | null {
  if (!shape.optionIds.includes(optionId)) return null;

  const ladder: Ladder =
    currentLadder(shape, grid) ??
    Object.fromEntries(shape.optionIds.map((id) => [id, rateAt(grid, id, packageId)]));

  const nextShape: MatrixShape = {
    ...shape,
    columns: shape.columns.map((column) =>
      column.packageId === packageId ? { ...column, includedOptionId: optionId } : column
    ),
  };

  const nextGrid: RateGrid = { ...grid };
  for (const brandId of shape.optionIds) {
    nextGrid[cellKey(brandId, packageId)] = (ladder[brandId] ?? 0) - (ladder[optionId] ?? 0);
  }
  return { shape: nextShape, grid: nextGrid };
}

export function diffGrids(shape: MatrixShape, before: RateGrid, after: RateGrid): RateChange[] {
  const changes: RateChange[] = [];
  for (const optionId of shape.optionIds) {
    for (const column of shape.columns) {
      const from = rateAt(before, optionId, column.packageId);
      const to = rateAt(after, optionId, column.packageId);
      if (from !== to) changes.push({ optionId, packageId: column.packageId, from, to });
    }
  }
  return changes;
}

/**
 * The rates to send for a save: every package's rate for each brand with at
 * least one change. The server replaces a brand's rates as a set, so a partial
 * row would leave the tiers it omits unpriced.
 */
export function rowsToSave(
  shape: MatrixShape,
  before: RateGrid,
  after: RateGrid
): Array<{ optionId: number; packageId: number; priceDelta: number }> {
  const changed = new Set(diffGrids(shape, before, after).map((change) => change.optionId));
  return shape.optionIds
    .filter((optionId) => changed.has(optionId))
    .flatMap((optionId) =>
      shape.columns.map((column) => ({
        optionId,
        packageId: column.packageId,
        priceDelta: rateAt(after, optionId, column.packageId) / 100,
      }))
    );
}

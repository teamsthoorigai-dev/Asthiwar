/**
 * A component's brand rates, kept consistent across package tiers.
 *
 * Every figure in the specification matrix answers one question: what does a
 * customer on package P pay to switch to brand B? The answer is the gap between
 * B and the brand P already includes, each measured on one shared scale — the
 * brand's position on the component's cost ladder:
 *
 *     rate(B, P) = ladder(B) − ladder(included(P))
 *
 * The seed is written this way (database/src/seeds/seed.ts, Option Prices) and
 * all 24 of its components obey it exactly. So four brands across four tiers
 * are sixteen figures but only four facts, one per brand. Edited one figure at a
 * time, they stop agreeing with each other: Ultratech +₹35 over ISI in Basic,
 * while the Luxury column still credits ISI −₹30 against Ultratech.
 *
 * This is the arithmetic for editing a row or a column and deriving the rest.
 * Amounts are whole paise throughout, so a derived difference never carries
 * float noise into a price.
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

/** Whether any column includes a brand. Without one there is no ladder to derive from. */
export function canLink(shape: MatrixShape): boolean {
  return shape.columns.some((column) => anchorOf(shape, column.packageId) !== null);
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
 * The ladder the matrix implies, read from the first column that includes a
 * brand. When the matrix already obeys the rule every column gives the same
 * answer; when it does not, this is the column the rest is rebuilt from.
 */
export function currentLadder(shape: MatrixShape, grid: RateGrid): Ladder | null {
  for (const column of shape.columns) {
    const ladder = ladderFromColumn(shape, grid, column.packageId);
    if (ladder) return ladder;
  }
  return null;
}

/**
 * Every rate the ladder implies. A column that includes no brand keeps its rates
 * from `grid` — there is nothing to derive them from.
 */
export function deriveGrid(shape: MatrixShape, ladder: Ladder, grid: RateGrid): RateGrid {
  const next: RateGrid = { ...grid };
  for (const column of shape.columns) {
    const anchor = anchorOf(shape, column.packageId);
    if (anchor === null) continue;
    for (const optionId of shape.optionIds) {
      next[cellKey(optionId, column.packageId)] = (ladder[optionId] ?? 0) - (ladder[anchor] ?? 0);
    }
  }
  return next;
}

/**
 * Move one brand along the ladder so that its rate in `packageId` becomes `rate`.
 *
 * A brand's rates across tiers are one fact seen from several places, so they
 * move together: its other rates follow, and so does every rate in a tier that
 * includes it. Null when the column cannot anchor the move — it includes no
 * brand, or includes this one, whose rate there is fixed at zero.
 */
export function moveBrand(
  shape: MatrixShape,
  ladder: Ladder,
  optionId: number,
  packageId: number,
  rate: Paise
): Ladder | null {
  const anchor = anchorOf(shape, packageId);
  if (anchor === null || anchor === optionId) return null;
  return { ...ladder, [optionId]: (ladder[anchor] ?? 0) + rate };
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

/**
 * The parts of pricing that are pure arithmetic.
 *
 * Split out of calculator.service.ts so they can be exercised without a database.
 * That file imports the Drizzle client, which meant every unit conversion and
 * floor calculation in the engine was unreachable from a plain test run — and the
 * suite that did run offline tested a second, hand-written engine in
 * src/lib/pricing/ that nothing imported and whose constants had already drifted
 * from the catalogue.
 *
 * Everything here is deliberately dependency-free. If a function needs a query,
 * it belongs in the service, not here.
 */

export type AreaUnit = 'sqft' | 'sqyards' | 'cents' | 'sqm';

/**
 * Conversion factors to square feet.
 *
 * 435.6 for a cent is the Tamil Nadu land measure (1 cent = 1/100 acre); 10.7639
 * for a square metre carries four decimals because rounding it to 10.76 shifts a
 * 3,000 sq.m plot by more than a square foot.
 */
export const SQFT_PER_UNIT: Record<AreaUnit, number> = {
  sqft: 1,
  sqyards: 9,
  cents: 435.6,
  sqm: 10.7639,
};

export function convertAreaToSqft(area: number, unit: AreaUnit = 'sqft'): number {
  const factor = SQFT_PER_UNIT[unit] ?? 1;
  return Number((area * factor).toFixed(2));
}

/**
 * How many floors a build actually has, counting the ground floor.
 *
 * `floorCount` counts floors *above* ground — 0 is Ground only, 3 is G+3 — so a
 * build always has one more floor than its label.
 */
export function floorsIncludingGround(floorCount: number): number {
  return floorCount + 1;
}

export interface BuildDuration {
  range: string;
  min: number;
  max: number;
  floorNumber: number;
}

/** Programme length by storey count. Beyond G+3, two months per extra floor. */
export function getDurationForFloors(floorsAboveGround: number): BuildDuration {
  if (floorsAboveGround === 0) return { range: '5–6 Months', min: 5, max: 6, floorNumber: 1 };
  if (floorsAboveGround === 1) return { range: '7–8 Months', min: 7, max: 8, floorNumber: 2 };
  if (floorsAboveGround === 2) return { range: '9–11 Months', min: 9, max: 11, floorNumber: 3 };
  if (floorsAboveGround === 3) return { range: '12–14 Months', min: 12, max: 14, floorNumber: 4 };

  const extraFloors = floorsAboveGround - 3;
  const min = 12 + extraFloors * 2;
  const max = 14 + extraFloors * 2;
  return {
    range: `${min}–${max} Months`,
    min,
    max,
    floorNumber: floorsIncludingGround(floorsAboveGround),
  };
}

/**
 * Every square foot a quotation is charged over.
 *
 * Head room is billed on its own line at its own rate, so it is not part of the
 * built-up area the base construction line multiplies out against — but it is
 * still built structure. This is the figure the volume discount is tested against
 * and the figure the all-in rate per sq.ft divides by; using built-up area for
 * either made the same enclosed area price differently depending on which line
 * it was booked under.
 */
export function totalEnclosedArea(totalBuiltupAreaSqft: number, headRoomAreaSqft: number): number {
  return Number((totalBuiltupAreaSqft + headRoomAreaSqft).toFixed(2));
}

/**
 * Split a total across a milestone schedule so the instalments sum to it exactly.
 *
 * Percentages of a rounded total do not add back up to that total, and the
 * difference lands on the customer's final payment. The last stage absorbs the
 * rounding rather than being computed independently.
 */
export function distributeMilestoneAmounts(
  total: number,
  percentages: readonly number[]
): number[] {
  const amounts: number[] = [];
  let distributed = 0;

  percentages.forEach((pct, index) => {
    const isLast = index === percentages.length - 1;
    if (isLast) {
      amounts.push(total - distributed);
      return;
    }
    const amount = Math.round(total * (pct / 100));
    distributed += amount;
    amounts.push(amount);
  });

  return amounts;
}

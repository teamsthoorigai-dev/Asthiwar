import { MILESTONES, VOLUME_THRESHOLD_SQFT } from '@/data/pricing';
import type {
  EstimateInput,
  EstimateResult,
  Package,
} from './types';

export const UNIT_TO_SQFT = {
  sqft: 1,
  cents: 435.6,
  sqyards: 9,
} as const;

export const FLOOR_MULTIPLIER = {
  ground: 1,
  g1: 2,
  g2: 3,
  g3: 4,
} as const;

export const PARKING_SQFT = {
  none: 0,
  one: 200,
  two: 400,
} as const;

export { VOLUME_THRESHOLD_SQFT };

export function normalisePlot(
  area: number,
  unit: keyof typeof UNIT_TO_SQFT,
): number {
  return area * UNIT_TO_SQFT[unit];
}

export function totalBuiltUp(
  perFloor: number,
  floors: keyof typeof FLOOR_MULTIPLIER,
  parking: keyof typeof PARKING_SQFT,
): number {
  return perFloor * FLOOR_MULTIPLIER[floors] + PARKING_SQFT[parking];
}

export function calculateFsi(builtUp: number, plotSqft: number): number {
  if (plotSqft <= 0) return 0;
  return Math.round((builtUp / plotSqft) * 100) / 100;
}

export function activeRate(pkg: Package, builtUp: number): number {
  return builtUp > VOLUME_THRESHOLD_SQFT ? pkg.volumeRate : pkg.standardRate;
}

export function estimate(input: EstimateInput): EstimateResult {
  const builtUp = totalBuiltUp(input.perFloor, input.floors, input.parking);
  const rate = activeRate(input.package, builtUp);
  const effectiveRate = rate * input.locationMultiplier;
  const baseCost = builtUp * effectiveRate;

  // Project rule 3: never treat missing prices as 0.
  const upgradesCost = input.upgrades.reduce((sum, upgrade) => {
    if (upgrade.deltaPerSqft === null) {
      throw new Error(
        `Cannot calculate estimate with unconfirmed upgrade price: '${upgrade.optionSlug}'`,
      );
    }
    return sum + upgrade.deltaPerSqft * builtUp;
  }, 0);

  const addOnsCost = input.addOns.reduce(
    (sum, addon) => sum + addon.price * addon.quantity,
    0,
  );

  const total = baseCost + upgradesCost + addOnsCost;

  // Rounding rule: round only at the milestone step (Math.round).
  const milestones = MILESTONES.map((m) => ({
    ...m,
    amount: Math.round((total * m.pct) / 100),
  }));

  return {
    builtUp,
    rate,
    effectiveRate,
    baseCost,
    upgradesCost,
    addOnsCost,
    total,
    volumeApplied: builtUp > VOLUME_THRESHOLD_SQFT,
    milestones,
  };
}

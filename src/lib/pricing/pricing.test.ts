import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  MILESTONES,
  PACKAGES,
  LOCATIONS,
  UPGRADE_CATEGORIES,
  ADDONS_CATALOGUE,
} from '@/data/pricing';
import {
  normalisePlot,
  totalBuiltUp,
  calculateFsi,
  activeRate,
  estimate,
} from '@/lib/pricing/engine';
import type { EstimateInput } from '@/lib/pricing/types';

describe('Pricing Engine & Data Tests', () => {
  it('milestone schedule percentages sum to exactly 100.0%', () => {
    assert.strictEqual(MILESTONES.length, 10, 'Expected 10 milestones in schedule');
    const totalPercentage = MILESTONES.reduce((sum, milestone) => sum + milestone.pct, 0);
    assert.strictEqual(
      totalPercentage,
      100,
      `Milestone percentages must sum to 100, got ${totalPercentage}`,
    );
  });

  it('normalisePlot converts area units accurately', () => {
    assert.strictEqual(normalisePlot(2400, 'sqft'), 2400);
    assert.ok(
      Math.abs(normalisePlot(3, 'cents') - 1306.8) < 0.0001,
      '3 cents should equal 1306.8 sqft',
    );
    assert.strictEqual(normalisePlot(100, 'sqyards'), 900);
  });

  it('totalBuiltUp calculates multi-floor and parking area correctly', () => {
    // Ground floor with no parking
    assert.strictEqual(totalBuiltUp(1200, 'ground', 'none'), 1200);

    // G+1 with 1 car parking (200 sqft)
    assert.strictEqual(totalBuiltUp(1500, 'g1', 'one'), 3200);

    // G+2 with 2 cars parking (400 sqft)
    assert.strictEqual(totalBuiltUp(1000, 'g2', 'two'), 3400);

    // G+3 with 2 cars parking (400 sqft)
    assert.strictEqual(totalBuiltUp(1000, 'g3', 'two'), 4400);
  });

  it('calculateFsi computes built-up to plot ratio accurately', () => {
    assert.strictEqual(calculateFsi(2400, 1200), 2);
    assert.strictEqual(calculateFsi(3200, 2400), 1.33);
    assert.strictEqual(calculateFsi(1000, 0), 0);
  });

  it('activeRate switches to volume rate when built-up exceeds 3,500 sqft', () => {
    const pkg = PACKAGES.find((p) => p.key === 'standard')!;
    assert.ok(pkg, 'Standard package exists');

    // At or below threshold: standard rate applies
    assert.strictEqual(activeRate(pkg, 3500), 2468);
    assert.strictEqual(activeRate(pkg, 2000), 2468);

    // Above threshold: volume rate applies
    assert.strictEqual(activeRate(pkg, 3501), 2357);
    assert.strictEqual(activeRate(pkg, 4000), 2357);
  });

  it('estimate calculates full breakdown and rounds only at milestones', () => {
    const pkg = PACKAGES.find((p) => p.key === 'standard')!;
    const location = LOCATIONS.find((l) => l.slug === 'chennai')!; // multiplier: 1.05

    const input: EstimateInput = {
      plotArea: 2400,
      plotUnit: 'sqft',
      perFloor: 1500,
      floors: 'g1', // multiplier 2 -> 3,000 sqft
      parking: 'one', // 200 sqft -> total 3,200 sqft
      package: pkg,
      locationMultiplier: location.multiplier,
      locationSlug: location.slug,
      upgrades: [
        {
          categorySlug: 'masonry',
          optionSlug: 'country-red-brick',
          deltaPerSqft: 100,
        },
      ],
      addOns: [
        {
          slug: 'cctv-surveillance',
          name: 'CCTV Surveillance',
          price: 45000,
          quantity: 1,
        },
      ],
    };

    const result = estimate(input);

    // 1. Built-up area
    assert.strictEqual(result.builtUp, 3200);
    assert.strictEqual(result.volumeApplied, false);

    // 2. Rates
    assert.strictEqual(result.rate, 2468);
    const expectedEffectiveRate = 2468 * 1.05; // 2591.4
    assert.strictEqual(result.effectiveRate, expectedEffectiveRate);

    // 3. Costs
    const expectedBaseCost = 3200 * expectedEffectiveRate; // 8,292,480
    assert.strictEqual(result.baseCost, expectedBaseCost);

    const expectedUpgradesCost = 100 * 3200; // 320,000
    assert.strictEqual(result.upgradesCost, expectedUpgradesCost);

    const expectedAddOnsCost = 45000;
    assert.strictEqual(result.addOnsCost, expectedAddOnsCost);

    const expectedTotal =
      expectedBaseCost + expectedUpgradesCost + expectedAddOnsCost; // 8,657,480
    assert.strictEqual(result.total, expectedTotal);

    // 4. Milestones
    assert.strictEqual(result.milestones.length, 10);
    const milestoneSum = result.milestones.reduce((s, m) => s + m.amount, 0);

    // Rounded milestone sum should match total within rounding tolerance
    assert.ok(
      Math.abs(milestoneSum - expectedTotal) <= 5,
      `Milestone sum ${milestoneSum} should be within rounding tolerance of ${expectedTotal}`,
    );

    // Check individual milestone rounding: M1 is 3% of 8,657,480 = 259,724.4 -> 259,724
    assert.strictEqual(result.milestones[0].amount, Math.round((expectedTotal * 3) / 100));
  });

  it('Project Rule 3: throws error when unconfirmed upgrade delta is calculated', () => {
    const pkg = PACKAGES[0];
    const input: EstimateInput = {
      plotArea: 2400,
      plotUnit: 'sqft',
      perFloor: 1200,
      floors: 'ground',
      parking: 'none',
      package: pkg,
      locationMultiplier: 1.0,
      upgrades: [
        {
          categorySlug: 'flooring',
          optionSlug: 'italian-marble',
          deltaPerSqft: null, // unknown price
        },
      ],
      addOns: [],
    };

    assert.throws(
      () => estimate(input),
      /Cannot calculate estimate with unconfirmed upgrade price/,
      'Must reject estimating unknown prices to avoid silently treating them as 0',
    );
  });

  it('catalogues have required items and structure', () => {
    assert.strictEqual(UPGRADE_CATEGORIES.length, 10, 'Expected 10 upgrade categories');
    assert.strictEqual(ADDONS_CATALOGUE.length, 15, 'Expected 15 add-on catalogue items');
    assert.strictEqual(PACKAGES.length, 4, 'Expected 4 packages');
    assert.strictEqual(LOCATIONS.length, 7, 'Expected 7 locations');
  });
});

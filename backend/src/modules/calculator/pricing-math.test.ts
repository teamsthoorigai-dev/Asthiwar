import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SQFT_PER_UNIT,
  convertAreaToSqft,
  distributeMilestoneAmounts,
  floorsIncludingGround,
  getDurationForFloors,
  totalEnclosedArea,
} from './pricing-math.js';
import {
  expandPackageTier,
  packageTierApplies,
  packageTierSpecificity,
  serializePackageTiers,
} from '../../services/addon-tiers.js';

/**
 * Offline pricing arithmetic.
 *
 * This replaces a suite that passed eight assertions against src/lib/pricing/ —
 * a second, hand-written engine that nothing in the application imported, priced
 * from constants that had already drifted from the catalogue (Basic's volume rate
 * was 2000 against the database's 1999), and rounded every milestone so its
 * instalments did not sum to the total. Green, and worth nothing.
 *
 * Everything below exercises code the live engine actually runs.
 */

const ALL_PACKAGES = ['basic', 'standard', 'premium', 'luxury'];

test('area conversions match the factors the catalogue is quoted in', () => {
  assert.equal(convertAreaToSqft(1200), 1200);
  assert.equal(convertAreaToSqft(1200, 'sqft'), 1200);
  assert.equal(convertAreaToSqft(100, 'sqyards'), 900);
  // 1 cent = 1/100 acre = 435.6 sq.ft — the Tamil Nadu land measure.
  assert.equal(convertAreaToSqft(2, 'cents'), 871.2);
  assert.equal(convertAreaToSqft(100, 'sqm'), 1076.39);
});

test('every area unit the schema accepts has a conversion factor', () => {
  // A unit in the Zod enum with no factor here would silently convert at 1:1 —
  // a 3,000 sq.m plot priced as 3,000 sq.ft.
  for (const unit of ['sqft', 'sqyards', 'cents', 'sqm'] as const) {
    assert.ok(SQFT_PER_UNIT[unit] > 0, `${unit} has no conversion factor`);
  }
});

test('floorCount counts floors above ground, so a build has one more', () => {
  assert.equal(floorsIncludingGround(0), 1); // Ground only
  assert.equal(floorsIncludingGround(3), 4); // G+3
});

test('programme length is defined for every floor count the schema allows', () => {
  // The schema permits 0..10. A gap here would leave a build with no duration.
  for (let floors = 0; floors <= 10; floors += 1) {
    const duration = getDurationForFloors(floors);
    assert.ok(duration.min > 0 && duration.max >= duration.min, `G+${floors} has no valid range`);
    assert.equal(duration.floorNumber, floorsIncludingGround(floors));
  }
});

test('programme length grows beyond the hand-written tiers', () => {
  assert.deepEqual(getDurationForFloors(4).min, 14);
  assert.deepEqual(getDurationForFloors(4).max, 16);
});

test('enclosed area counts head room alongside built-up area', () => {
  // Two builds with the same enclosed area must reach the volume threshold
  // together, whichever line the area is booked under.
  assert.equal(totalEnclosedArea(3600, 0), 3600);
  assert.equal(totalEnclosedArea(3400, 200), 3600);
});

test('milestone instalments sum to the total exactly', () => {
  const total = 10150640;
  const percentages = [3, 4, 15, 22, 14, 8, 10, 11, 8, 5];
  const amounts = distributeMilestoneAmounts(total, percentages);

  assert.equal(amounts.length, percentages.length);
  assert.equal(
    amounts.reduce((sum, amount) => sum + amount, 0),
    total,
    'instalments must sum to the total — any shortfall lands on the final payment'
  );
});

test('milestone instalments still sum exactly on a total that rounds badly', () => {
  // Thirds of an odd number are where naive rounding leaves a rupee behind.
  const total = 1000001;
  const amounts = distributeMilestoneAmounts(total, [33.33, 33.33, 33.34]);
  assert.equal(amounts.reduce((sum, amount) => sum + amount, 0), total);
});

test('add-on tiers resolve across all three stored encodings', () => {
  // addon_prices.package_tier holds 'all', a CSV, or a legacy group name, and
  // rows in the live catalogue still carry each one.
  assert.equal(packageTierApplies('all', 'basic'), true);
  assert.equal(packageTierApplies('', 'luxury'), true);
  assert.equal(packageTierApplies('basic_standard', 'standard'), true);
  assert.equal(packageTierApplies('basic_standard', 'premium'), false);
  assert.equal(packageTierApplies('premium_luxury', 'luxury'), true);
  assert.equal(packageTierApplies('basic,premium', 'premium'), true);
  assert.equal(packageTierApplies('basic,premium', 'standard'), false);
});

test('a narrower tier outranks a blanket one', () => {
  // Two rows can share a variant slug; the engine charges the more specific.
  assert.ok(packageTierSpecificity('basic') < packageTierSpecificity('basic,premium'));
  assert.ok(packageTierSpecificity('basic,premium') < packageTierSpecificity('all'));
});

test('a selection covering every package is stored as all, not a CSV', () => {
  // A frozen CSV would silently exclude any package added to the catalogue later.
  assert.equal(serializePackageTiers(ALL_PACKAGES, ALL_PACKAGES), 'all');
  assert.equal(serializePackageTiers(['basic', 'premium'], ALL_PACKAGES), 'basic,premium');
  // Catalogue order, not the order the operator ticked boxes.
  assert.equal(serializePackageTiers(['premium', 'basic'], ALL_PACKAGES), 'basic,premium');
  assert.equal(serializePackageTiers([], ALL_PACKAGES), 'all');
});

test('expanding a tier round-trips through serialisation', () => {
  for (const tier of ['all', 'basic_standard', 'premium_luxury', 'basic,luxury']) {
    const slugs = expandPackageTier(tier, ALL_PACKAGES);
    for (const slug of slugs) {
      assert.equal(packageTierApplies(tier, slug), true, `${tier} should cover ${slug}`);
    }
    for (const slug of ALL_PACKAGES.filter((s) => !slugs.includes(s))) {
      assert.equal(packageTierApplies(tier, slug), false, `${tier} should not cover ${slug}`);
    }
  }
});

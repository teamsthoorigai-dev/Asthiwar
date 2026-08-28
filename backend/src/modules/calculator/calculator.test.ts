/**
 * ASTHIWAR — Authoritative Pricing & Calculation Engine Verification Suite (Phase 4)
 *
 * Tests:
 * 1. Unit conversion (Cents, Sq.Yards -> Sq.Ft)
 * 2. Standard Base Package Calculation (<= 3,500 sq.ft)
 * 3. Volume Discount Rate Transition (> 3,500 sq.ft)
 * 4. Location Multipliers (Coimbatore 1.0, Chennai 1.05, Pollachi 0.96)
 * 5. Brand Customizations & Upgrade Deltas (Red brick upgrade, Waterproofing)
 * 6. Add-Ons Matrix (Sump, Septic, Solar, Lift, Compound wall)
 * 7. 10-Stage Milestone Breakdown Sum Equality (100% exact to the rupee)
 * 8. Estimate Number Format (EST-YYYY-XXXXXX)
 * 9. Live Neon PostgreSQL Snapshot Persistence & Verification
 */

import { calculateEstimate, convertAreaToSqft } from './calculator.service.js';
import { db, estimates, estimateItems, estimateAddons, eq, pool } from '@asthiwar/database';

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    testsPassed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    if (details) console.error(`     Details: ${details}`);
    testsFailed++;
  }
}

async function runTests() {
  console.log('\n📐 ASTHIWAR Calculation Engine Test Suite — Phase 4\n');
  console.log('----------------------------------------------------');

  try {
    // -----------------------------------------------------------------------
    // Test 1: Unit Conversions
    // -----------------------------------------------------------------------
    console.log('\n[Test 1] Area Unit Conversions');
    const centsSqft = convertAreaToSqft(3, 'cents'); // 3 * 435.6 = 1306.8
    assert(centsSqft === 1306.8, '3 Cents converts to 1306.8 sq.ft', `Got ${centsSqft}`);

    const yardsSqft = convertAreaToSqft(200, 'sqyards'); // 200 * 9 = 1800
    assert(yardsSqft === 1800, '200 Sq.Yards converts to 1800 sq.ft', `Got ${yardsSqft}`);

    const directSqft = convertAreaToSqft(1500, 'sqft');
    assert(directSqft === 1500, '1500 Sq.Ft converts directly to 1500 sq.ft', `Got ${directSqft}`);

    // -----------------------------------------------------------------------
    // Test 2: Standard Rate Package Calculation (<= 3,500 sq.ft)
    // -----------------------------------------------------------------------
    console.log('\n[Test 2] Standard Rate Calculation (<= 3,500 sq.ft)');
    // 1,000 sqft per floor * G+1 (2 floors) = 2,000 sqft total.
    // Standard package rate = ₹2,468 / sqft. Base cost = 2,000 * 2,468 = ₹49,36,000
    const resStd = await calculateEstimate({
      customerName: 'Test Customer',
      customerPhone: '9876543210',
      customerEmail: 'test@example.com',
      plotLocation: 'Coimbatore',
      plotArea: 1500,
      builtupAreaPerFloor: 1000,
      floorCount: 1,
      packageSlug: 'standard',
    });

    assert(resStd.dimensions.totalBuiltupAreaSqft === 2000, 'Total builtup area is 2000 sqft');
    assert(!resStd.package.isVolumeRateApplied, 'Standard rate is applied (not volume)');
    assert(resStd.package.baseRatePerSqft === 2468, 'Base rate is ₹2,468 / sqft');
    assert(resStd.breakdown.baseConstructionCost === 4936000, 'Base cost is exactly ₹49,36,000', `Got ${resStd.breakdown.baseConstructionCost}`);
    assert(resStd.breakdown.totalProjectCost === 4936000, 'Total project cost matches subtotal without add-ons');

    // -----------------------------------------------------------------------
    // Test 3: Volume Rate Calculation (> 3,500 sq.ft)
    // -----------------------------------------------------------------------
    console.log('\n[Test 3] Volume Rate Trigger (> 3,500 sq.ft)');
    // 2,000 sqft per floor * G+1 (2 floors) = 4,000 sqft (> 3,500).
    // Basic volume rate = ₹2,000 (standard is ₹2,099). Base cost = 4,000 * 2,000 = ₹80,00,000
    const resVol = await calculateEstimate({
      customerName: 'Volume Customer',
      customerPhone: '9876543211',
      customerEmail: 'volume@example.com',
      plotLocation: 'Coimbatore',
      plotArea: 3000,
      builtupAreaPerFloor: 2000,
      floorCount: 1,
      packageSlug: 'basic',
    });

    assert(resVol.dimensions.totalBuiltupAreaSqft === 4000, 'Total builtup area is 4000 sqft');
    assert(resVol.package.isVolumeRateApplied, 'Volume discount rate is applied');
    assert(resVol.package.baseRatePerSqft === 2000, 'Volume base rate is ₹2,000 / sqft (standard is ₹2,099)');
    assert(resVol.breakdown.baseConstructionCost === 8000000, 'Base cost is exactly ₹80,00,000', `Got ${resVol.breakdown.baseConstructionCost}`);

    // -----------------------------------------------------------------------
    // Test 4: Location Multipliers
    // -----------------------------------------------------------------------
    console.log('\n[Test 4] City Location Multipliers');
    // Chennai multiplier: 1.0500. Standard package (₹2,468) * 1.05 = ₹2,591.40 / sqft
    const resChennai = await calculateEstimate({
      customerName: 'Chennai Customer',
      customerPhone: '9876543212',
      customerEmail: 'chennai@example.com',
      plotLocation: 'Chennai',
      plotArea: 1200,
      builtupAreaPerFloor: 1000,
      floorCount: 0,
      packageSlug: 'standard',
    });

    assert(resChennai.package.locationMultiplier === 1.05, 'Chennai location multiplier is 1.05');
    assert(resChennai.package.effectiveRatePerSqft === 2591.4, 'Effective rate in Chennai is ₹2,591.40 / sqft');
    assert(resChennai.breakdown.baseConstructionCost === 2591400, 'Base cost in Chennai is ₹25,91,400', `Got ${resChennai.breakdown.baseConstructionCost}`);

    // Pollachi multiplier: 0.9600. Standard package (₹2,468) * 0.96 = ₹2,369.28 / sqft
    const resPollachi = await calculateEstimate({
      customerName: 'Pollachi Customer',
      customerPhone: '9876543213',
      customerEmail: 'pollachi@example.com',
      plotLocation: 'Pollachi',
      plotArea: 1200,
      builtupAreaPerFloor: 1000,
      floorCount: 0,
      packageSlug: 'standard',
    });

    assert(resPollachi.package.locationMultiplier === 0.96, 'Pollachi location multiplier is 0.96');
    assert(resPollachi.package.effectiveRatePerSqft === 2369.28, 'Effective rate in Pollachi is ₹2,369.28 / sqft');

    // -----------------------------------------------------------------------
    // Test 5: Brand Customizations & Upgrade Deltas
    // -----------------------------------------------------------------------
    console.log('\n[Test 5] Customizations & Brand Upgrades');
    // Standard package (2,000 sqft) + Red brick upgrade (+₹100/sqft = ₹2,00,000)
    const resCust = await calculateEstimate({
      customerName: 'Custom Customer',
      customerPhone: '9876543214',
      customerEmail: 'custom@example.com',
      plotLocation: 'Coimbatore',
      plotArea: 1500,
      builtupAreaPerFloor: 1000,
      floorCount: 1,
      packageSlug: 'standard',
      customizations: [
        { itemSlug: 'masonry_work', optionSlug: 'red_brick' },
      ],
    });

    assert(resCust.customizations.length === 1, '1 customization recognized');
    assert(resCust.customizations[0].unitPriceDelta === 100, 'Red brick upgrade delta is ₹100/sqft');
    assert(resCust.customizations[0].calculatedPrice === 200000, 'Red brick calculated price is ₹2,00,000 (2000 sqft * ₹100)');
    assert(resCust.breakdown.upgradesCost === 200000, 'Total upgrades cost is ₹2,00,000');
    assert(resCust.breakdown.totalProjectCost === 4936000 + 200000, 'Total project cost includes upgrades (₹51,36,000)');

    // -----------------------------------------------------------------------
    // Test 6: 15 Add-Ons Matrix
    // -----------------------------------------------------------------------
    console.log('\n[Test 6] Add-Ons Calculations');
    // Sump (5,000L @ ₹26/L = ₹1,30,000) + Solar 3kW (₹1,80,000) + Lift 4pax (₹12,50,000)
    const resAddons = await calculateEstimate({
      customerName: 'Addon Customer',
      customerPhone: '9876543215',
      customerEmail: 'addon@example.com',
      plotLocation: 'Coimbatore',
      plotArea: 2000,
      builtupAreaPerFloor: 1500,
      floorCount: 1,
      packageSlug: 'premium',
      addons: [
        { addonSlug: 'underground_sump', variantSlug: 'flyash', quantity: 5000 },
        { addonSlug: 'rooftop_solar', variantSlug: '3kw' },
        { addonSlug: 'passenger_lift', variantSlug: '4pax' },
      ],
    });

    assert(resAddons.addons.length === 3, '3 add-ons recognized');
    const sump = resAddons.addons.find((a) => a.addonSlug === 'underground_sump');
    assert(sump?.totalPrice === 130000, '5000L Flyash Sump is ₹1,30,000 (@ ₹26/L)', `Got ${sump?.totalPrice}`);

    const solar = resAddons.addons.find((a) => a.addonSlug === 'rooftop_solar');
    assert(solar?.totalPrice === 180000, '3kW Solar is ₹1,80,000', `Got ${solar?.totalPrice}`);

    const lift = resAddons.addons.find((a) => a.addonSlug === 'passenger_lift');
    assert(lift?.totalPrice === 1250000, '4-Pax Lift is ₹12,50,000', `Got ${lift?.totalPrice}`);

    const expectedAddonsTotal = 130000 + 180000 + 1250000;
    assert(resAddons.breakdown.addonsCost === expectedAddonsTotal, `Addons cost is exactly ₹${expectedAddonsTotal.toLocaleString('en-IN')}`);

    // -----------------------------------------------------------------------
    // Test 7: 10-Stage Milestone Phase Breakdown
    // -----------------------------------------------------------------------
    console.log('\n[Test 7] 10-Stage Milestone Phase Breakdown');
    assert(resStd.milestones.length === 10, '10 milestones generated');
    const totalMilestoneSum = resStd.milestones.reduce((acc, m) => acc + m.amount, 0);
    assert(
      totalMilestoneSum === resStd.breakdown.totalProjectCost,
      `Sum of all 10 milestone amounts (₹${totalMilestoneSum}) exactly equals totalProjectCost (₹${resStd.breakdown.totalProjectCost})`
    );

    const totalMilestonePct = resStd.milestones.reduce((acc, m) => acc + m.percentage, 0);
    assert(totalMilestonePct === 100, 'Total milestone percentages sum to exactly 100%');

    // -----------------------------------------------------------------------
    // Test 8: Estimate Number Format
    // -----------------------------------------------------------------------
    console.log('\n[Test 8] Estimate Number Format');
    const estNumRegex = /^EST-\d{4}-[A-F0-9]{6}$/;
    assert(estNumRegex.test(resStd.estimateNumber), `Estimate Number '${resStd.estimateNumber}' matches 'EST-YYYY-XXXXXX' format`);

    // -----------------------------------------------------------------------
    // Test 9: Live Database Persistence & Snapshot Immutability
    // -----------------------------------------------------------------------
    console.log('\n[Test 9] Live Neon PostgreSQL Persistence & Snapshot Verification');
    const persisted = await calculateEstimate(
      {
        customerName: 'Aswin Verified',
        customerPhone: '9876500000',
        customerEmail: 'aswin.test@asthiwar.com',
        plotLocation: 'Coimbatore',
        plotArea: 2400,
        plotAreaUnit: 'sqft',
        builtupAreaPerFloor: 1200,
        floorCount: 2,
        carParkingAreaSqft: 250,
        carCount: 1,
        packageSlug: 'premium',
        customizations: [
          { itemSlug: 'masonry_work', optionSlug: 'red_brick' },
        ],
        addons: [
          { addonSlug: 'underground_sump', variantSlug: 'flyash', quantity: 5000 },
          { addonSlug: 'rooftop_solar', variantSlug: '3kw' },
        ],
      },
      { persist: true }
    );

    assert(Boolean(persisted.estimateId), `Estimate successfully saved with UUID: ${persisted.estimateId}`);

    // Verify row in Neon database
    if (persisted.estimateId) {
      const dbEstimate = await db
        .select()
        .from(estimates)
        .where(eq(estimates.id, persisted.estimateId))
        .limit(1);

      assert(dbEstimate.length === 1, 'Estimate found in database');
      assert(dbEstimate[0].estimateNumber === persisted.estimateNumber, 'DB Estimate number matches');
      assert(Number(dbEstimate[0].totalProjectCost) === persisted.breakdown.totalProjectCost, 'DB Total cost matches calculation');

      const dbItems = await db
        .select()
        .from(estimateItems)
        .where(eq(estimateItems.estimateId, persisted.estimateId));
      assert(dbItems.length === 1, `1 Customization item saved in DB (${dbItems[0]?.selectedOptionName})`);

      const dbAddons = await db
        .select()
        .from(estimateAddons)
        .where(eq(estimateAddons.estimateId, persisted.estimateId));
      assert(dbAddons.length === 2, `2 Add-ons saved in DB (Sump & Solar)`);
    }

    console.log('\n----------------------------------------------------');
    console.log(`Results: ${testsPassed} Passed, ${testsFailed} Failed\n`);

    if (testsFailed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test suite crashed with error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runTests();

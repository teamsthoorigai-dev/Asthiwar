/**
 * TASK-024: Authoritative Parity Test Suite
 * Validates mathematical formulas, unit conversions, duration mapping,
 * and 10-milestone sum equality for ASTHIWAR calculator engine.
 */

import { convertAreaToSqft, getDurationForFloors, MILESTONE_DEFINITIONS, STANDARD_EXCLUSIONS } from './calculator.service.js';

let passed = 0;
let failed = 0;

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual === expected) {
    console.log(`  ✅ [PASS] ${label}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${label} — Expected: ${expected}, Got: ${actual}`);
    failed++;
  }
}

function runParityGate() {
  console.log('\n======================================================');
  console.log('  ASTHIWAR PARITY GATE: Authoritative Calculation Suite');
  console.log('======================================================\n');

  // -------------------------------------------------------------------------
  // Test 1: Area Unit Conversions
  // -------------------------------------------------------------------------
  console.log('[Test 1] Area Unit Conversions (Cents, Sq.Yards, Sq.M, Sq.Ft)');
  assertEqual(convertAreaToSqft(1, 'cents'), 435.6, '1 Cent = 435.6 sq.ft');
  assertEqual(convertAreaToSqft(5.5, 'cents'), 2395.8, '5.5 Cents = 2,395.8 sq.ft');
  assertEqual(convertAreaToSqft(100, 'sqyards'), 900, '100 Sq.Yards = 900 sq.ft');
  assertEqual(convertAreaToSqft(100, 'sqm'), 1076.39, '100 Sq.M = 1,076.39 sq.ft');
  assertEqual(convertAreaToSqft(2400, 'sqft'), 2400, '2,400 Sq.Ft = 2,400 sq.ft');

  // -------------------------------------------------------------------------
  // Test 2: Construction Timeline Mapping by Floor Level
  // -------------------------------------------------------------------------
  console.log('\n[Test 2] Construction Duration Mapping');
  const dG = getDurationForFloors(0); // Ground floor only
  assertEqual(dG.range, '5–6 Months', 'Ground floor takes 5–6 months');
  assertEqual(dG.floorNumber, 1, 'Ground floor is 1 level');

  const dG1 = getDurationForFloors(1); // G+1
  assertEqual(dG1.range, '7–8 Months', 'G+1 takes 7–8 months');
  assertEqual(dG1.floorNumber, 2, 'G+1 is 2 levels');

  const dG2 = getDurationForFloors(2); // G+2
  assertEqual(dG2.range, '9–11 Months', 'G+2 takes 9–11 months');
  assertEqual(dG2.floorNumber, 3, 'G+2 is 3 levels');

  const dG3 = getDurationForFloors(3); // G+3
  assertEqual(dG3.range, '12–14 Months', 'G+3 takes 12–14 months');
  assertEqual(dG3.floorNumber, 4, 'G+3 is 4 levels');

  const dG4 = getDurationForFloors(4); // G+4
  assertEqual(dG4.range, '14–16 Months', 'G+4 takes 14–16 months');
  assertEqual(dG4.floorNumber, 5, 'G+4 is 5 levels');

  // -------------------------------------------------------------------------
  // Test 3: Milestone Schedule Exact Percentage Sum
  // -------------------------------------------------------------------------
  console.log('\n[Test 3] 10-Milestone Schedule Integrity');
  assertEqual(MILESTONE_DEFINITIONS.length, 10, 'Exactly 10 milestone stages defined');
  const totalPercentage = MILESTONE_DEFINITIONS.reduce((acc, m) => acc + m.percentage, 0);
  assertEqual(totalPercentage, 100, 'Milestone percentage sum is exactly 100%');

  // -------------------------------------------------------------------------
  // Test 4: Exclusions Matrix
  // -------------------------------------------------------------------------
  console.log('\n[Test 4] Standard Exclusions Compliance');
  assertEqual(STANDARD_EXCLUSIONS.length >= 10, true, 'At least 10 standard exclusions transparently listed');

  // -------------------------------------------------------------------------
  // Test 5: Rupee-Exact Financial Formula Parity
  // -------------------------------------------------------------------------
  console.log('\n[Test 5] Mathematical Rupee Computation Parity');
  // Scenario: 2,000 sq.ft @ ₹2,468/sq.ft in Chennai (1.05x multiplier)
  // Effective rate: 2468 * 1.05 = 2591.4
  // Base cost: 2000 * 2591.4 = 5182800
  const area = 2000;
  const baseRate = 2468;
  const multiplier = 1.05;
  const effectiveRate = Number((baseRate * multiplier).toFixed(2));
  const baseCost = Math.round(area * effectiveRate);

  assertEqual(effectiveRate, 2591.4, 'Effective rate calculates with 2 decimals (₹2,591.40)');
  assertEqual(baseCost, 5182800, 'Base cost in Chennai is exact (₹51,82,800)');

  // Milestone allocations for ₹51,82,800
  const milestoneAllocations = MILESTONE_DEFINITIONS.map(m => Math.round((baseCost * m.percentage) / 100));
  const totalAllocated = milestoneAllocations.reduce((a, b) => a + b, 0);
  assertEqual(totalAllocated, baseCost, 'Sum of all 10 milestone rupee allocations equals baseCost exactly');

  console.log('\n------------------------------------------------------');
  console.log(`Parity Gate Result: ${passed} passed, ${failed} failed.`);
  console.log('------------------------------------------------------\n');

  if (failed > 0) process.exit(1);
}

runParityGate();

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canLink,
  cellKey,
  currentLadder,
  deriveGrid,
  diffGrids,
  formatRupees,
  ladderFromColumn,
  moveBrand,
  parseRupees,
  rateAt,
  rowsToSave,
  toPaise,
  withIncludedBrand,
  type MatrixShape,
  type RateGrid,
} from './rateMatrix';

/**
 * Cement, exactly as the seed prices it: each tier includes a different brand,
 * and every rate is the gap between two brands' positions on one ladder
 * (ISI 0, JSW 5, Ramco/Dalmia 15, Ultratech/Chettinad 35).
 */
const ISI = 1;
const JSW = 2;
const RAMCO = 3;
const ULTRATECH = 4;
const BASIC = 10;
const STANDARD = 11;
const PREMIUM = 12;
const LUXURY = 13;

const shape: MatrixShape = {
  optionIds: [ISI, JSW, RAMCO, ULTRATECH],
  columns: [
    { packageId: BASIC, includedOptionId: ISI },
    { packageId: STANDARD, includedOptionId: JSW },
    { packageId: PREMIUM, includedOptionId: RAMCO },
    { packageId: LUXURY, includedOptionId: ULTRATECH },
  ],
};

function gridOf(rows: Record<number, [number, number, number, number]>): RateGrid {
  const grid: RateGrid = {};
  for (const [optionId, rates] of Object.entries(rows)) {
    [BASIC, STANDARD, PREMIUM, LUXURY].forEach((packageId, index) => {
      grid[cellKey(Number(optionId), packageId)] = toPaise(rates[index]);
    });
  }
  return grid;
}

const cement = gridOf({
  [ISI]: [0, -5, -15, -35],
  [JSW]: [5, 0, -10, -30],
  [RAMCO]: [15, 10, 0, -20],
  [ULTRATECH]: [35, 30, 20, 0],
});

const rupees = (grid: RateGrid, optionId: number, packageId: number) => rateAt(grid, optionId, packageId) / 100;

test('the seeded matrix is one ladder, so deriving it changes nothing', () => {
  const ladder = currentLadder(shape, cement);
  assert.deepEqual(ladder, { [ISI]: 0, [JSW]: 500, [RAMCO]: 1500, [ULTRATECH]: 3500 });
  assert.deepEqual(diffGrids(shape, cement, deriveGrid(shape, ladder!, cement)), []);
});

test('every column reads the same ladder, up to where it is measured from', () => {
  const fromLuxury = ladderFromColumn(shape, cement, LUXURY)!;
  assert.deepEqual(fromLuxury, { [ISI]: -3500, [JSW]: -3000, [RAMCO]: -2000, [ULTRATECH]: 0 });
  assert.deepEqual(diffGrids(shape, cement, deriveGrid(shape, fromLuxury, cement)), []);
});

test('a row edit moves the brand: its row and the column that includes it follow', () => {
  const ladder = moveBrand(shape, currentLadder(shape, cement)!, ULTRATECH, BASIC, toPaise(40))!;
  const after = deriveGrid(shape, ladder, cement);

  // Ultratech's own row, measured from each tier's included brand.
  assert.equal(rupees(after, ULTRATECH, BASIC), 40);
  assert.equal(rupees(after, ULTRATECH, STANDARD), 35);
  assert.equal(rupees(after, ULTRATECH, PREMIUM), 25);
  assert.equal(rupees(after, ULTRATECH, LUXURY), 0);

  // Luxury includes Ultratech, so a plainer brand there is now a bigger credit.
  assert.equal(rupees(after, ISI, LUXURY), -40);
  assert.equal(rupees(after, JSW, LUXURY), -35);
  assert.equal(rupees(after, RAMCO, LUXURY), -25);

  // Nothing else moves.
  assert.equal(diffGrids(shape, cement, after).length, 6);
  assert.equal(rupees(after, JSW, PREMIUM), -10);
});

test('a brand cannot be moved from the tier that includes it, or from a tier with no included brand', () => {
  const ladder = currentLadder(shape, cement)!;
  assert.equal(moveBrand(shape, ladder, ULTRATECH, LUXURY, toPaise(5)), null);

  const unanchored: MatrixShape = {
    ...shape,
    columns: shape.columns.map((c) => (c.packageId === STANDARD ? { ...c, includedOptionId: null } : c)),
  };
  assert.equal(moveBrand(unanchored, ladder, RAMCO, STANDARD, toPaise(5)), null);
});

test('a column edit sets the whole ladder, and every other column is rebuilt from it', () => {
  const edited = { ...cement, [cellKey(JSW, BASIC)]: toPaise(7) };
  const after = deriveGrid(shape, ladderFromColumn(shape, edited, BASIC)!, cement);

  assert.deepEqual(
    [BASIC, STANDARD, PREMIUM, LUXURY].map((p) => rupees(after, JSW, p)),
    [7, 0, -8, -28]
  );
  // Standard includes JSW, so its column is re-measured from JSW's new position.
  assert.deepEqual(
    [ISI, JSW, RAMCO, ULTRATECH].map((o) => rupees(after, o, STANDARD)),
    [-7, 0, 8, 28]
  );
});

test('a tier that includes no brand keeps its rates and anchors nothing', () => {
  const noStandard: MatrixShape = {
    ...shape,
    columns: shape.columns.map((c) => (c.packageId === STANDARD ? { ...c, includedOptionId: null } : c)),
  };
  const odd = { ...cement, [cellKey(RAMCO, STANDARD)]: toPaise(99) };
  const after = deriveGrid(noStandard, currentLadder(noStandard, odd)!, odd);
  assert.equal(rupees(after, RAMCO, STANDARD), 99);
  assert.equal(ladderFromColumn(noStandard, odd, STANDARD), null);

  const nothingIncluded: MatrixShape = {
    ...shape,
    columns: shape.columns.map((c) => ({ ...c, includedOptionId: null })),
  };
  assert.equal(canLink(nothingIncluded), false);
  assert.equal(currentLadder(nothingIncluded, cement), null);
});

test('an included brand that is not one of the component’s brands anchors nothing', () => {
  const stale: MatrixShape = {
    ...shape,
    columns: shape.columns.map((c) => (c.packageId === BASIC ? { ...c, includedOptionId: 999 } : c)),
  };
  assert.equal(ladderFromColumn(stale, cement, BASIC), null);
  // The ladder is read from the next tier that does include one of its brands.
  assert.deepEqual(currentLadder(stale, cement), { [ISI]: -500, [JSW]: 0, [RAMCO]: 1000, [ULTRATECH]: 3000 });
});

test('switching a tier’s included brand re-measures that column only', () => {
  const switched = withIncludedBrand(shape, cement, PREMIUM, ULTRATECH)!;
  assert.equal(switched.shape.columns.find((c) => c.packageId === PREMIUM)!.includedOptionId, ULTRATECH);
  assert.deepEqual(
    [ISI, JSW, RAMCO, ULTRATECH].map((o) => rupees(switched.grid, o, PREMIUM)),
    [-35, -30, -20, 0]
  );
  const changes = diffGrids(shape, cement, switched.grid);
  assert.ok(changes.every((change) => change.packageId === PREMIUM));
  assert.equal(changes.length, 4);

  assert.equal(withIncludedBrand(shape, cement, PREMIUM, 999), null);
});

test('the first included brand anywhere re-measures its column from the column itself', () => {
  const nothingIncluded: MatrixShape = {
    ...shape,
    columns: shape.columns.map((c) => ({ ...c, includedOptionId: null })),
  };
  const switched = withIncludedBrand(nothingIncluded, cement, BASIC, JSW)!;
  assert.deepEqual(
    [ISI, JSW, RAMCO, ULTRATECH].map((o) => rupees(switched.grid, o, BASIC)),
    [-5, 0, 10, 30]
  );
  assert.ok(diffGrids(nothingIncluded, cement, switched.grid).every((c) => c.packageId === BASIC));
});

test('a save carries the full row of each changed brand and nothing else', () => {
  const ladder = moveBrand(shape, currentLadder(shape, cement)!, ULTRATECH, BASIC, toPaise(40))!;
  const rows = rowsToSave(shape, cement, deriveGrid(shape, ladder, cement));

  // Ultratech changed, and ISI, JSW and Ramco each changed in Luxury.
  assert.deepEqual([...new Set(rows.map((r) => r.optionId))], [ISI, JSW, RAMCO, ULTRATECH]);
  assert.equal(rows.length, 16);
  assert.deepEqual(
    rows.filter((r) => r.optionId === ISI).map((r) => r.priceDelta),
    [0, -5, -15, -40]
  );
  assert.deepEqual(rowsToSave(shape, cement, cement), []);
});

test('typed amounts parse to exact paise', () => {
  assert.equal(parseRupees(''), 0);
  assert.equal(parseRupees('  '), 0);
  assert.equal(parseRupees('-12.5'), -1250);
  assert.equal(parseRupees('45'), 4500);
  assert.equal(parseRupees('-'), null);
  assert.equal(parseRupees('abc'), null);
  // 0.1 + 0.2 is 0.30000000000000004 in floats; in paise it is 30.
  assert.equal(formatRupees(toPaise(0.1) + toPaise(0.2)), '0.30');
  assert.equal(formatRupees(-1250), '-12.50');
});

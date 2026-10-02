import assert from 'node:assert/strict';
import test from 'node:test';
import {
  cellKey,
  currentLadder,
  diffGrids,
  formatRupees,
  ladderFromColumn,
  mirrorsOf,
  parseRupees,
  rateAt,
  rowsToSave,
  toPaise,
  withIncludedBrand,
  withMirrors,
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

const edit = (grid: RateGrid, cells: Array<[number, number, number]>): RateGrid => {
  const next = { ...grid };
  for (const [optionId, packageId, rate] of cells) next[cellKey(optionId, packageId)] = toPaise(rate);
  return next;
};

test('every seeded rate already equals minus its mirror', () => {
  for (const optionId of shape.optionIds) {
    for (const { packageId } of shape.columns) {
      for (const mirror of mirrorsOf(shape, optionId, packageId)) {
        assert.equal(rateAt(cement, optionId, packageId), -rateAt(cement, mirror.optionId, mirror.packageId));
      }
    }
  }
  assert.deepEqual(diffGrids(shape, cement, withMirrors(shape, cement, cement)), []);
});

test('a rate mirrors to the brand its tier includes, in the tier that includes it', () => {
  assert.deepEqual(mirrorsOf(shape, ULTRATECH, BASIC), [{ optionId: ISI, packageId: LUXURY }]);
  assert.deepEqual(mirrorsOf(shape, ISI, LUXURY), [{ optionId: ULTRATECH, packageId: BASIC }]);
  assert.deepEqual(mirrorsOf(shape, JSW, BASIC), [{ optionId: ISI, packageId: STANDARD }]);
  // An included brand's own rate is fixed at zero and has no mirror.
  assert.deepEqual(mirrorsOf(shape, ISI, BASIC), []);
});

test('editing Ultratech in Basic changes only it and ISI in Luxury', () => {
  const after = withMirrors(shape, cement, edit(cement, [[ULTRATECH, BASIC, 40]]));
  assert.equal(rupees(after, ULTRATECH, BASIC), 40);
  assert.equal(rupees(after, ISI, LUXURY), -40);
  assert.equal(diffGrids(shape, cement, after).length, 2);
  // The rest of Ultratech's row and the rest of Luxury's column stand.
  assert.equal(rupees(after, ULTRATECH, STANDARD), 30);
  assert.equal(rupees(after, JSW, LUXURY), -30);
});

test('and the reverse: editing ISI in Luxury sets Ultratech in Basic', () => {
  const after = withMirrors(shape, cement, edit(cement, [[ISI, LUXURY, -50]]));
  assert.equal(rupees(after, ULTRATECH, BASIC), 50);
  assert.equal(diffGrids(shape, cement, after).length, 2);
});

test('a column edit mirrors each changed rate into its own pair', () => {
  const after = withMirrors(shape, cement, edit(cement, [[JSW, BASIC, 7], [RAMCO, BASIC, 18]]));
  assert.equal(rupees(after, ISI, STANDARD), -7);
  assert.equal(rupees(after, ISI, PREMIUM), -18);
  assert.equal(diffGrids(shape, cement, after).length, 4);
});

test('a tier that includes no brand has no mirrors', () => {
  const noStandard: MatrixShape = {
    ...shape,
    columns: shape.columns.map((c) => (c.packageId === STANDARD ? { ...c, includedOptionId: null } : c)),
  };
  const after = withMirrors(noStandard, cement, edit(cement, [[RAMCO, STANDARD, 99]]));
  assert.deepEqual(diffGrids(noStandard, cement, after).length, 1);
  // Nothing includes JSW now, so JSW's rates have no mirror either.
  assert.deepEqual(mirrorsOf(noStandard, JSW, BASIC), []);
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
  const rows = rowsToSave(shape, cement, withMirrors(shape, cement, edit(cement, [[ULTRATECH, BASIC, 40]])));

  // Ultratech changed in Basic, ISI in Luxury.
  assert.deepEqual([...new Set(rows.map((r) => r.optionId))], [ISI, ULTRATECH]);
  assert.equal(rows.length, 8);
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

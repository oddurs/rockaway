import { describe, expect, test } from 'vitest';
import {
  CELL_COVER_GRACE,
  cellsCovering,
  cellsIn,
  floorCell,
  nearestCell,
} from '../src/cell-metrics.ts';

describe('cellsIn: how many cells fit in a box', () => {
  test('a box laid out a hair under n cells is n cells', () => {
    // 51 cells of a 9.6328125px advance is 491.2734375px; layout snaps it to
    // 1/64px below that. Floored, that read 50, and a fieldset drew a cell short.
    expect(cellsIn(491.265625, 9.6328125)).toBe(51);
    // Gecko's sixtieths: a viewport of exactly 100 cells, measured a float under.
    expect(cellsIn(960 - 1 / 60, 9.6)).toBe(100);
  });

  test('a box half a cell over n cells is still n cells', () => {
    expect(cellsIn(10.5 * 8, 8)).toBe(10);
  });

  test('a box short of n cells by more than the snap is n - 1, so nothing passes its edge', () => {
    // 50 cells of 9.6px is 480px; a box a tenth of a pixel under it holds 49.
    expect(cellsIn(479.9, 9.6)).toBe(49);
  });

  test('never negative, never from nothing', () => {
    expect(cellsIn(0, 8)).toBe(0);
    expect(cellsIn(-20, 8)).toBe(0);
    expect(cellsIn(80, 0)).toBe(0);
    expect(cellsIn(Number.NaN, 8)).toBe(0);
  });
});

describe('cellsCovering: how many cells cover a length', () => {
  test('a length a hair either side of n cells takes n, not n + 1', () => {
    // Select's trigger: five runs, a few hundredths over thirty cells.
    expect(cellsCovering(30 * 9.6 + 0.04, 9.6)).toBe(30);
    expect(cellsCovering(30 * 9.6 - 0.04, 9.6)).toBe(30);
  });

  test('errors that add up across boxes laid end to end are still n cells', () => {
    // Thirty boxes, each a layout unit out: half a pixel either way.
    expect(cellsCovering(30 * 9.6 + 30 / 64, 9.6)).toBe(30);
    expect(cellsCovering(30 * 9.6 + 30 / 60, 9.6)).toBe(30);
  });

  test('a length more than a sixteenth of a cell over n cells takes n + 1', () => {
    expect(cellsCovering(30 * 9.6 + 1, 9.6)).toBe(31);
    expect(cellsCovering((30 + 2 * CELL_COVER_GRACE) * 9.6, 9.6)).toBe(31);
  });

  test('never negative, never from nothing', () => {
    expect(cellsCovering(0, 8)).toBe(0);
    expect(cellsCovering(-20, 8)).toBe(0);
    expect(cellsCovering(80, 0)).toBe(0);
  });
});

describe('positions in cells', () => {
  test('a tie goes to the start, the same whichever side of it an engine lands', () => {
    // Centred in seven spare cells: 3.5, a hair either side in two engines.
    expect(nearestCell(3.5)).toBe(3);
    expect(nearestCell(3.5 - 1 / 64 / 9.6)).toBe(3);
    expect(nearestCell(3.5 + 1 / 60 / 9.6)).toBe(3);
    expect(nearestCell(3.6)).toBe(4);
    expect(nearestCell(3.4)).toBe(3);
  });

  test('a position a hair under a whole cell is that cell', () => {
    expect(floorCell(4 - 1 / 64 / 9.6)).toBe(4);
    expect(floorCell(4.9)).toBe(4);
    expect(floorCell(3.9)).toBe(3);
  });
});

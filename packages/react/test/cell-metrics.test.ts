import { describe, expect, test } from 'vitest';
import { CELL_GRACE, cellsCovering, cellsIn } from '../src/cell-metrics.ts';

describe('cellsIn', () => {
  test('a box laid out a hair under n cells is n cells', () => {
    // 51 cells of a 9.6328125px advance is 491.2734375px; layout snaps it to
    // 1/64px below that. Floored, that read 50, and a fieldset drew a cell short.
    expect(cellsIn(491.265625, 9.6328125)).toBe(51);
  });

  test('errors that add up across boxes laid end to end are still whole cells', () => {
    // Thirty boxes, each a layout unit short: half a pixel under thirty cells.
    expect(cellsIn(30 * 9.6 - 30 / 64, 9.6)).toBe(30);
    // In Gecko's sixtieths, too.
    expect(cellsIn(30 * 9.6 - 30 / 60, 9.6)).toBe(30);
  });

  test('a box half a cell over n cells is still n cells', () => {
    expect(cellsIn(10.5 * 8, 8)).toBe(10);
  });

  test('a box short by more than a sixteenth of a cell is n - 1', () => {
    // 50 cells of 9.6px is 480px; a box a full pixel under it holds 49.
    expect(cellsIn(479, 9.6)).toBe(49);
    // Within a sixteenth (0.6px) it is 50, drawn a sliver past its edge rather
    // than a cell short.
    expect(cellsIn(479.9, 9.6)).toBe(50);
  });

  test('never negative, never from nothing', () => {
    expect(cellsIn(0, 8)).toBe(0);
    expect(cellsIn(-20, 8)).toBe(0);
    expect(cellsIn(80, 0)).toBe(0);
    expect(cellsIn(Number.NaN, 8)).toBe(0);
  });
});

describe('cellsCovering', () => {
  test('a length a hair over n cells takes n, not n + 1', () => {
    // Select's trigger: five runs, a few hundredths over thirty cells.
    expect(cellsCovering(30 * 9.6 + 0.04, 9.6)).toBe(30);
    expect(cellsCovering(30 * 9.6 - 0.04, 9.6)).toBe(30);
  });

  test('a length more than a sixteenth over n cells takes n + 1', () => {
    expect(cellsCovering(30 * 9.6 + 1, 9.6)).toBe(31);
  });

  test('agrees with cellsIn on whole cells, within the grace either way', () => {
    for (const n of [1, 7, 24, 51, 80, 200]) {
      for (const off of [-0.9, -0.1, 0, 0.1, 0.9]) {
        const px = (n + off * CELL_GRACE) * 9.6;
        expect(cellsIn(px, 9.6)).toBe(n);
        expect(cellsCovering(px, 9.6)).toBe(n);
      }
    }
  });

  test('never negative, never from nothing', () => {
    expect(cellsCovering(0, 8)).toBe(0);
    expect(cellsCovering(-20, 8)).toBe(0);
    expect(cellsCovering(80, 0)).toBe(0);
  });
});

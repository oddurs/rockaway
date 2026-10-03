import { describe, expect, test } from 'vitest';
import { cellsIn } from '../src/cell-metrics.ts';

describe('cellsIn', () => {
  test('a box laid out a hair under n cells is n cells', () => {
    // 51 cells of a 9.6328125px advance is 491.2734375px; layout snaps it to
    // 1/64px below that. Floored, that read 50, and a fieldset drew a cell short.
    expect(cellsIn(491.265625, 9.6328125)).toBe(51);
  });

  test('a box half a cell over n cells is still n cells', () => {
    expect(cellsIn(10.5 * 8, 8)).toBe(10);
  });

  test('never negative, never from nothing', () => {
    expect(cellsIn(0, 8)).toBe(0);
    expect(cellsIn(-20, 8)).toBe(0);
    expect(cellsIn(80, 0)).toBe(0);
    expect(cellsIn(Number.NaN, 8)).toBe(0);
  });
});

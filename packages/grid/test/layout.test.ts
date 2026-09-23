import { describe, expect, test } from 'vitest';
import { rect } from '../src/geometry.ts';
import { columns, fixed, grow, rows, solve, type Track } from '../src/layout.ts';

const sum = (ns: readonly number[]): number => ns.reduce((a, b) => a + b, 0);

describe('solve', () => {
  test('gives whole cells that add up to the space', () => {
    const { sizes, leftover, overflow } = solve(80, [grow(), grow(), grow()]);
    expect(sizes).toEqual([27, 27, 26]);
    expect(sum(sizes)).toBe(80);
    expect([leftover, overflow]).toEqual([0, 0]);
  });

  test('fixed tracks take what they asked for, growers take the rest', () => {
    const { sizes } = solve(40, [fixed(10), grow(), fixed(4), grow()]);
    expect(sizes).toEqual([10, 13, 4, 13]);
    expect(sum(sizes)).toBe(40);
  });

  test('weights split the remainder in proportion', () => {
    expect(solve(30, [grow(2), grow(1)]).sizes).toEqual([20, 10]);
    expect(solve(31, [grow(2), grow(1)]).sizes).toEqual([21, 10]);
  });

  test('gaps come out of the space, not out of the tracks', () => {
    const { sizes, offsets } = solve(20, [grow(), grow()], { gap: 2 });
    expect(sizes).toEqual([9, 9]);
    expect(offsets).toEqual([0, 11]);
  });

  test('minimums are met before anyone grows', () => {
    const { sizes } = solve(20, [grow(1, { min: 8 }), grow(3)]);
    expect(sizes).toEqual([11, 9]);
    expect(sum(sizes)).toBe(20);
  });

  test('maximums stop a track, and the rest take what it could not', () => {
    const { sizes, leftover } = solve(40, [grow(1, { max: 5 }), grow(1)]);
    expect(sizes).toEqual([5, 35]);
    expect(leftover).toBe(0);
  });

  test('when everything is capped, the leftover is reported, not hidden', () => {
    const { sizes, leftover } = solve(40, [grow(1, { max: 5 }), grow(1, { max: 5 })]);
    expect(sizes).toEqual([5, 5]);
    expect(leftover).toBe(30);
  });

  test('overflow is reported, not hidden', () => {
    const tight = solve(10, [fixed(8), fixed(8)]);
    expect(tight.overflow).toBe(6);
    expect(tight.sizes).toEqual([8, 8]);

    const minimums = solve(10, [grow(1, { min: 8 }), grow(1, { min: 8 })]);
    expect(minimums.overflow).toBe(6);
  });

  test('refuses anything that is not whole cells', () => {
    expect(() => solve(10.5, [grow()])).toThrow(/whole cells/);
    expect(() => solve(10, [grow()], { gap: -1 })).toThrow(/whole cells/);
  });

  test('no tracks is not an error', () => {
    expect(solve(10, [])).toEqual({ sizes: [], offsets: [], overflow: 0, leftover: 10 });
  });
});

describe('the properties that keep a resize calm', () => {
  const layouts: Track[][] = [
    [grow(), grow(), grow()],
    [fixed(12), grow(), grow(2)],
    [grow(1, { min: 4 }), grow(3, { max: 30 }), fixed(2)],
    [grow(), fixed(1), grow(), fixed(1), grow()],
  ];

  test('always whole, never negative, never more than the space', () => {
    for (const tracks of layouts) {
      for (let total = 0; total <= 120; total++) {
        const { sizes, overflow } = solve(total, tracks, { gap: 1 });
        for (const size of sizes) {
          expect(Number.isInteger(size)).toBe(true);
          expect(size).toBeGreaterThanOrEqual(0);
        }
        if (overflow === 0) expect(sum(sizes) + (sizes.length - 1)).toBeLessThanOrEqual(total);
      }
    }
  });

  test('the same input always gives the same output', () => {
    for (const tracks of layouts) {
      for (const total of [37, 80, 113]) {
        expect(solve(total, tracks)).toEqual(solve(total, tracks));
      }
    }
  });

  test('one more cell grows exactly one track by one, and shrinks none', () => {
    for (const tracks of layouts) {
      for (let total = 20; total < 120; total++) {
        const before = solve(total, tracks).sizes;
        const after = solve(total + 1, tracks).sizes;
        const deltas = after.map((size, i) => size - (before[i] as number));
        for (const delta of deltas) expect(delta).toBeGreaterThanOrEqual(0);
        expect(sum(deltas), `at ${total} → ${total + 1}`).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('splitting a rect', () => {
  test('columns tile the area exactly, with no gaps of their own', () => {
    const parts = columns(rect(0, 0, 30, 5), [grow(), grow(), grow()]);
    expect(parts).toEqual([rect(0, 0, 10, 5), rect(10, 0, 10, 5), rect(20, 0, 10, 5)]);
  });

  test('rows do the same downward, and respect the gap', () => {
    const parts = rows(rect(2, 3, 8, 11), [fixed(3), grow()], { gap: 1 });
    expect(parts).toEqual([rect(2, 3, 8, 3), rect(2, 7, 8, 7)]);
  });

  test('a solved box is a container for the next solve', () => {
    const [left, right] = columns(rect(0, 0, 40, 10), [grow(), grow()]);
    const stacked = rows(left as ReturnType<typeof rect>, [fixed(1), grow()]);
    expect(stacked.map((r) => [r.x, r.y, r.width, r.height])).toEqual([
      [0, 0, 20, 1],
      [0, 1, 20, 9],
    ]);
    expect(right).toEqual(rect(20, 0, 20, 10));
  });
});

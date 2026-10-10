import { describe, expect, it } from 'vitest';
import { comforts, fieldSteps, flow, rhythm, seamRows } from '../src/rhythm.ts';

describe('rhythm (0311, 0312)', () => {
  it('closes half-steps to whole rows', () => {
    expect([0, 1, 2, 3, 4].map(seamRows)).toEqual([0, 1, 1, 2, 2]);
    expect(() => seamRows(1.5)).toThrow(RangeError);
    expect(() => seamRows(-1)).toThrow(RangeError);
  });

  it('lays a flow out on half-steps and seams it on a whole row', () => {
    // Three two-row fields a row and a half apart: 4 + 3 + 4 + 3 + 4 = 18 half-steps.
    expect(flow([4, 4, 4], 3)).toEqual({ offsets: [0, 7, 14], steps: 18, rows: 9, pad: 0 });
    // Two one-row blocks half a row apart: 5 half-steps, padded to 3 rows.
    expect(flow([2, 2], 1)).toEqual({ offsets: [0, 3], steps: 5, rows: 3, pad: 1 });
    expect(flow([], 3)).toEqual({ offsets: [], steps: 0, rows: 0, pad: 0 });
  });

  it('pairs horizontal half-steps, so padding across is whole cells', () => {
    for (const c of comforts) expect(rhythm[c].padX % 2).toBe(0);
  });

  it('makes a comfortable field three rows, and a compact one two', () => {
    expect(fieldSteps('comfortable')).toBe(6); // label 1 + box ½+1+½ = 3 rows
    expect(fieldSteps('comfortable', { help: true })).toBe(10); // + ½ + 1 = 4½, seamed to 5
    expect(fieldSteps('compact')).toBe(4); // label + one-row control
    expect(fieldSteps('compact', { label: false })).toBe(2);
  });
});

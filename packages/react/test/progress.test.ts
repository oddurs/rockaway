/** Progress, as cells (cairn 0101): what the bars, meters, sparklines and spinner draw. */
import { shapeOf, toText } from '@rockaway/grid';
import { glyphsFor, themeGlyphs } from '@rockaway/tokens';
import { describe, expect, test } from 'vitest';
import {
  barCells,
  indeterminateCells,
  meterBuffer,
  meterTone,
  percentText,
  progressBuffer,
  sparklineBuffer,
  sparklineSummary,
  spinnerFrame,
} from '../src/components/progress.pure.ts';

const g = themeGlyphs.default;
const ascii = glyphsFor({ borderSet: 'ascii' });
const width = (s: string) => [...s].length;

describe('a bar', () => {
  test('fills in eighths of a cell, and is always exactly its width', () => {
    for (let pct = 0; pct <= 100; pct++) {
      const { fill, track } = barCells(pct / 100, 10, g);
      expect(width(fill) + width(track), `${pct}%`).toBe(10);
    }
    expect(barCells(0, 10, g)).toEqual({ fill: '', track: g.block.light.repeat(10) });
    expect(barCells(1, 10, g)).toEqual({ fill: g.block.full.repeat(10), track: '' });
    // 62% of 10 cells is 6.2 cells: six full and the edge two eighths across.
    expect(barCells(0.62, 10, g).fill).toBe(`${g.block.full.repeat(6)}${g.fill[1]}`);
  });

  test('shows something for anything above nothing', () => {
    expect(barCells(0.001, 10, g).fill).toBe(g.fill[0]);
  });

  test('is drawn by the cell: every glyph in it is a block shape', () => {
    const { fill, track } = barCells(0.37, 12, g);
    for (const ch of fill + track) expect(shapeOf(ch)?.kind, ch).toBe('block');
  });

  test('an ASCII theme draws it in ASCII', () => {
    const { fill, track } = barCells(0.66, 12, ascii);
    expect(`${fill}${track}`).toMatch(/^[#=\-.]{12}$/);
  });

  test('the percentage always takes four cells', () => {
    expect([0, 0.07, 0.62, 1].map(percentText)).toEqual(['  0%', '  7%', ' 62%', '100%']);
  });

  test('a progress bar keeps its width whatever its value', () => {
    const widths = new Set(
      [0, 3, 50, 99, 100, undefined].map(
        (value) =>
          progressBuffer(
            { label: 'Installing', cols: 16, ...(value === undefined ? {} : { value }) },
            g,
          ).width,
      ),
    );
    expect(widths.size).toBe(1);
  });
});

describe('an indeterminate bar', () => {
  test('is the medium shade at rest, which is all reduced motion shows', () => {
    expect(indeterminateCells(0, 12, g)).toEqual({
      before: g.block.medium.repeat(12),
      block: '',
      after: '',
    });
  });

  test('then a block a quarter of it crosses, and comes back, a cell a frame', () => {
    const at = (frame: number) => {
      const { before, block, after } = indeterminateCells(frame, 12, g);
      expect(width(before) + width(block) + width(after)).toBe(12);
      expect(width(block)).toBe(3);
      return width(before);
    };
    expect([1, 2, 3, 9, 10, 11, 17, 18].map(at)).toEqual([0, 1, 2, 8, 9, 8, 2, 1]);
  });
});

describe('a meter', () => {
  test('takes its tone from its thresholds', () => {
    const t = { warning: 70, danger: 90 };
    expect([10, 70, 89, 90, 100].map((v) => meterTone(v, t))).toEqual([
      'success',
      'warning',
      'warning',
      'danger',
      'danger',
    ]);
    expect(meterTone(50, {})).toBeUndefined();
  });

  test('where low is bad, takes them the other way', () => {
    const battery = { warning: 30, danger: 10 };
    expect([80, 30, 10, 5].map((v) => meterTone(v, battery))).toEqual([
      'success',
      'warning',
      'danger',
      'danger',
    ]);
  });

  test('says its tone with a mark, not only a colour', () => {
    const row = (value: number) =>
      toText(meterBuffer({ label: 'cpu', value, warning: 70, danger: 90, cols: 10 }, g));
    expect(row(40)).toContain(`${g.mark.blank} 40%`);
    expect(row(75)).toContain(`${g.mark.danger} 75%`);
    expect(row(95)).toContain(`${g.mark.cross} 95%`);
  });
});

describe('a sparkline', () => {
  test('in braille, holds two values a cell, filled from the bottom', () => {
    // 1, 3, 2, 4 out of 4: the left column one dot, the right three, then two and four.
    const text = toText(sparklineBuffer({ values: [1, 3, 2, 4], cols: 2, max: 4 }, g));
    expect([...text].map((ch) => shapeOf(ch)?.dots)).toEqual([
      [5, 6, 7, 8],
      [3, 4, 5, 6, 7, 8],
    ]);
  });

  test('draws the newest values that fit, at the right', () => {
    const many = Array.from({ length: 40 }, (_, i) => i);
    const short = Array.from({ length: 4 }, (_, i) => i + 36);
    const a = toText(sparklineBuffer({ values: many, cols: 2, min: 0, max: 39 }, g));
    const b = toText(sparklineBuffer({ values: short, cols: 2, min: 0, max: 39 }, g));
    expect(a).toBe(b);
  });

  test('shows any value above the bottom, so a quiet series is still a line', () => {
    const text = toText(sparklineBuffer({ values: [1, 1000], cols: 1 }, g));
    expect(shapeOf(text)?.dots).toContain(7);
  });

  test('stacks levels across rows: four a row in braille, eight in bars', () => {
    const tall = toText(sparklineBuffer({ values: [12, 12], cols: 1, rows: 3, max: 12 }, g));
    expect(tall.split('\n')).toHaveLength(3);
    expect(new Set(tall.split('\n'))).toEqual(new Set([String.fromCodePoint(0x28ff)]));
    const bars = toText(sparklineBuffer({ values: [4, 8], cols: 2, max: 8, kind: 'bars' }, g));
    expect(bars).toBe(`${g.bar[3]}${g.bar[7]}`);
  });

  test('draws bars under an ASCII theme, which has no braille', () => {
    const text = toText(sparklineBuffer({ values: [1, 2, 3, 4], cols: 4, max: 4 }, ascii));
    expect([...text].every((ch) => ascii.bar.includes(ch))).toBe(true);
  });

  test('says the series in words', () => {
    expect(sparklineSummary('Load', [0.4, 4.25, 1, 2.4])).toBe(
      'Load: 4 values, from 0.4 to 2.4, lowest 0.4, highest 4.25',
    );
    expect(sparklineSummary('Load', [])).toBe('Load: no values');
  });
});

describe('a spinner', () => {
  test('turns through its theme’s frames, round and round', () => {
    expect(g.spinner.map((_, i) => spinnerFrame(i, g))).toEqual(g.spinner);
    expect(spinnerFrame(g.spinner.length, g)).toBe(g.spinner[0]);
    expect(ascii.spinner.map((_, i) => spinnerFrame(i, ascii)).join('')).toBe('|/-\\');
  });

  test('its Unicode frames are braille the cell draws', () => {
    for (const frame of g.spinner) expect(shapeOf(frame)?.kind, frame).toBe('braille');
  });
});

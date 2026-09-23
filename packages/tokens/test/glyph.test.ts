import { stringWidth } from '@rockaway/grid';
import { describe, expect, test } from 'vitest';
import {
  bars,
  blocks,
  borderSetNames,
  borderSets,
  glyphs,
  marks,
  spinnerFrames,
} from '../src/glyph.ts';

const everyGlyph = [
  ...borderSetNames.flatMap((set) => Object.values(borderSets[set])),
  ...Object.values(marks),
  ...Object.values(blocks),
  ...bars,
  ...spinnerFrames,
];

describe('glyphs', () => {
  test('every one is a single cell, measured by the engine itself', () => {
    for (const glyph of everyGlyph) {
      expect(stringWidth(glyph), `${glyph} (${glyph.codePointAt(0)?.toString(16)})`).toBe(1);
    }
  });

  test('every border set has the same eleven slots', () => {
    const slots = Object.keys(borderSets.single).sort();
    for (const set of borderSetNames)
      expect(Object.keys(borderSets[set]).sort(), set).toEqual(slots);
    expect(slots).toHaveLength(11);
  });

  test('ascii draws the same geometry with - | +', () => {
    expect(borderSets.ascii.horizontal).toBe('-');
    expect(borderSets.ascii.vertical).toBe('|');
    expect(new Set(Object.values(borderSets.ascii))).toEqual(new Set(['-', '|', '+']));
  });

  test('rounded differs from single only at the corners', () => {
    for (const [slot, ch] of Object.entries(borderSets.rounded)) {
      const same = ch === borderSets.single[slot as keyof typeof borderSets.single];
      expect(same, slot).toBe(!slot.includes('top-') && !slot.includes('bottom-'));
    }
  });

  test('the theme names one set as current, and keeps the others available', () => {
    const doc = glyphs('double').glyph as Record<
      string,
      Record<string, Record<string, { $value: string }>>
    >;
    expect(doc.border?.current?.horizontal?.$value).toBe('═');
    expect(doc.border?.single?.horizontal?.$value).toBe('─');
    expect(Object.keys(doc.border ?? {}).filter((k) => !k.startsWith('$'))).toEqual([
      ...borderSetNames,
      'current',
    ]);
  });

  test('the spinner is the ten braille frames every terminal uses', () => {
    expect(spinnerFrames).toHaveLength(10);
    expect(spinnerFrames[0]).toBe('⠋');
  });

  test('the bar has eight steps, from one eighth to full', () => {
    expect(bars).toHaveLength(8);
    expect(bars.at(-1)).toBe('█');
  });
});

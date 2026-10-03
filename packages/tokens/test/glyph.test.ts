import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { stringWidth } from '@rockaway/grid';
import { describe, expect, test } from 'vitest';
import {
  bars,
  blocks,
  borderSetNames,
  borderSets,
  delimiters,
  type Glyphs,
  glyphs,
  glyphsFor,
  markNames,
  marks,
  type Repertoire,
  spinnerFrames,
} from '../src/glyph.ts';
import { themeGlyphs, themeNames, themes } from '../src/themes.ts';

const repertoires: readonly Repertoire[] = ['unicode', 'ascii'];

const everyGlyph = [
  ...borderSetNames.flatMap((set) => Object.values(borderSets[set])),
  ...repertoires.flatMap((r) => [
    ...Object.values(marks[r]),
    ...Object.values(blocks[r]),
    ...bars[r],
    ...spinnerFrames[r],
  ]),
  ...Object.values(delimiters).flat(),
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
    expect(spinnerFrames.unicode).toHaveLength(10);
    expect(spinnerFrames.unicode[0]).toBe('⠋');
  });

  test('the bar has eight steps, from one eighth to full, in both repertoires', () => {
    for (const r of repertoires) {
      expect(bars[r], r).toHaveLength(8);
      expect(bars[r].at(-1), r).toBe(blocks[r].full);
    }
  });

  test('both repertoires name the same marks and blocks', () => {
    for (const r of repertoires) {
      expect(Object.keys(marks[r]), r).toEqual([...markNames]);
      expect(Object.keys(blocks[r]).sort(), r).toEqual(Object.keys(blocks.unicode).sort());
    }
  });

  test('the ascii repertoire is ASCII, all of it', () => {
    const ascii = glyphsFor({ borderSet: 'ascii' });
    for (const ch of everyCharacter(ascii)) expect(ch, `U+${hex(ch)}`).toMatch(/^[\x20-\x7e]$/);
  });

  test('every other border set draws its marks in Unicode', () => {
    for (const set of borderSetNames.filter((s) => s !== 'ascii')) {
      expect(glyphsFor({ borderSet: set }).mark.cursor, set).toBe('▸');
    }
  });

  test('the marks a state needs are distinct where they sit together', () => {
    // A checkbox shows one of three between its delimiters; a radio one of
    // two. Each must differ from the others, or a state reads as another.
    for (const r of repertoires) {
      const m = marks[r];
      expect(new Set([m.check, m.dash, m.blank]).size, r).toBe(3);
      expect(new Set([m.radio, m['radio-empty']]).size, r).toBe(2);
      expect(m['radio-empty'].trim(), `${r}: an empty radio is still a mark`).not.toBe('');
      expect(m['sort-ascending'], r).not.toBe(m['sort-descending']);
      expect(m['overflow-start'], r).not.toBe(m['overflow-end']);
      expect(m['switch-thumb'], r).not.toBe(m['switch-track']);
    }
  });
});

describe('the Glyphs object and the tokens agree', () => {
  test.each(themeNames)('%s: the DTCG glyph tokens are written from its Glyphs', (name) => {
    const resolved = themeGlyphs[name];
    expect(resolved).toEqual(glyphsFor(themes[name]));
    expect(tokenValues(glyphs(themes[name].borderSet))).toEqual(expectedTokens(resolved));
  });

  test('tokens.css carries the default theme’s glyphs, value for value', async () => {
    const css = await readFile(path.join(import.meta.dirname, '..', 'css', 'tokens.css'), 'utf8');
    const declared = new Map(
      [...css.matchAll(/^\s*--rk-(glyph-[\w-]+):\s*"((?:[^"\\]|\\.)*)";/gm)].map((m) => [
        m[1],
        JSON.parse(`"${m[2]}"`) as string,
      ]),
    );
    for (const [id, value] of expectedTokens(themeGlyphs.default)) {
      expect(declared.get(id.replaceAll('.', '-')), id).toBe(value);
    }
  });
});

function hex(ch: string): string {
  return (ch.codePointAt(0) ?? 0).toString(16).padStart(4, '0');
}

function everyCharacter(g: Glyphs): string[] {
  return [
    ...Object.values(g.border),
    ...Object.values(g.mark),
    ...Object.values(g.block),
    ...g.bar,
    ...g.spinner,
    ...Object.values(g.delimiter).flat(),
  ];
}

/** What the tokens should hold for a theme's glyphs, as `glyph.mark.cursor` → `▸`. */
function expectedTokens(g: Glyphs): Map<string, string> {
  const out = new Map<string, string>();
  const put = (prefix: string, entries: Iterable<[string, string]>): void => {
    for (const [k, v] of entries) out.set(`glyph.${prefix}.${k}`, v);
  };
  put('border.current', Object.entries(g.border));
  put('mark', Object.entries(g.mark));
  put('block', Object.entries(g.block));
  const numbered = (frames: readonly string[]): [string, string][] =>
    frames.map((ch, i) => [String(i + 1), ch]);
  put('bar', numbered(g.bar));
  put('spinner', numbered(g.spinner));
  for (const [name, [open, close]] of Object.entries(g.delimiter)) {
    out.set(`glyph.delimiter.${name}.open`, open);
    out.set(`glyph.delimiter.${name}.close`, close);
  }
  return out;
}

/** The generated tokens, flattened the same way, leaving out the sets a theme does not draw with. */
function tokenValues(doc: unknown, trail: string[] = []): Map<string, string> {
  const out = new Map<string, string>();
  const walk = (node: Record<string, unknown>, at: string[]): void => {
    if ('$value' in node) {
      out.set(at.join('.'), node.$value as string);
      return;
    }
    for (const [k, v] of Object.entries(node)) {
      if (k.startsWith('$')) continue;
      if (at.join('.') === 'glyph.border' && k !== 'current') continue;
      walk(v as Record<string, unknown>, [...at, k]);
    }
  };
  walk(doc as Record<string, unknown>, trail);
  return out;
}

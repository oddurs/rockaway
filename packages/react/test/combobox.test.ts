import { Attr, hasAttr, toText } from '@rockaway/grid';
import { themeGlyphs } from '@rockaway/tokens';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import {
  type ComboBoxText,
  comboBoxBoxBuffer,
  comboBoxBuffer,
  comboBoxInputCells,
  matchingOptions,
  matchRange,
} from '../src/components/combobox.pure.ts';
import { ComboBox, ComboBoxItem } from '../src/components/combobox.tsx';

const AUTHORS: ComboBoxText['options'] = [
  { label: 'Ada Lovelace' },
  { label: 'Aurora Rhee' },
  { label: 'Grace Hopper' },
  { label: 'Laurent Kim' },
  { label: 'Zoë Durand' },
];

describe('matchRange', () => {
  test('the first place the query is, without case', () => {
    expect(matchRange('Aurora Rhee', 'aur')).toEqual([0, 3]);
    expect(matchRange('Laurent Kim', 'AUR')).toEqual([1, 4]);
    expect(matchRange('Grace Hopper', 'aur')).toBeUndefined();
  });

  test('without accents, either way round, in the label’s own code units', () => {
    expect(matchRange('Zoë Durand', 'zoe')).toEqual([0, 3]);
    // A decomposed ë is two code units, and the match takes both.
    expect(matchRange('Zoë Durand', 'zoe')).toEqual([0, 4]);
    expect(matchRange('Zurich', 'zü')).toEqual([0, 2]);
  });

  test('an empty query matches nowhere, and keeps every option', () => {
    expect(matchRange('Ada', '')).toBeUndefined();
    expect(matchingOptions(AUTHORS, '')).toHaveLength(AUTHORS.length);
    expect(matchingOptions(AUTHORS, 'aur').map((o) => o.label)).toEqual([
      'Aurora Rhee',
      'Laurent Kim',
    ]);
  });
});

describe('the box', () => {
  test('exactly cols wide: the text in the third cell, the mark before the closing delimiter', () => {
    const box = (text: Partial<ComboBoxText>): string =>
      toText(comboBoxBoxBuffer({ cols: 16, options: [], ...text }), { trimEnd: false });
    expect([box({ input: 'aur' }), box({ placeholder: 'Find one' }), box({})]).toEqual([
      '[ aur         ▾]',
      '[ Find one    ▾]',
      '[             ▾]',
    ]);
    expect(comboBoxInputCells(16)).toBe(11);
  });

  test('text longer than the box is cut where it ends, the end’s overflow mark beside it', () => {
    const glyphs = themeGlyphs.default;
    const text = toText(
      comboBoxBoxBuffer({ cols: 12, options: [], input: 'a long name indeed' }, glyphs),
    );
    expect(text).toBe(`[ a long ${glyphs.mark['overflow-end']}▾]`);
  });

  test('the placeholder is dim, and invalid colours the delimiters', () => {
    const placeholder = comboBoxBoxBuffer({ cols: 12, options: [], placeholder: 'x' });
    const cell = placeholder.at({ x: 2, y: 0 });
    expect(cell && hasAttr(cell.style, Attr.dim)).toBe(true);
    const invalid = comboBoxBoxBuffer({ cols: 12, options: [], invalid: true });
    expect(invalid.at({ x: 0, y: 0 })?.style.fg).toBe('border.danger');
  });
});

describe('the popover', () => {
  test('the options the input matches, the match underlined and bold in the accent', () => {
    const open = comboBoxBuffer({ cols: 20, options: AUTHORS, input: 'aur', open: true });
    const rows = toText(open).split('\n');
    expect(rows.slice(2, 4)).toEqual(['┃   Aurora Rhee    ┃', '┃   Laurent Kim    ┃']);
    // `aur` in Laurent is its 2nd to 4th letters: cells 5, 6 and 7.
    const styles = [4, 5, 6, 7, 8].map((x) => open.at({ x, y: 3 })?.style);
    expect(styles.map((s) => (s ? hasAttr(s, Attr.underline | Attr.bold) : false))).toEqual([
      false,
      true,
      true,
      true,
      false,
    ]);
    expect(styles[1]?.fg).toBe('fg.accent');
  });

  test('a selected row keeps its own colour for the match, and reverses', () => {
    const open = comboBoxBuffer({
      cols: 20,
      options: AUTHORS,
      input: 'aur',
      open: true,
      selected: 'Aurora Rhee',
    });
    const match = open.at({ x: 4, y: 2 })?.style;
    expect(match?.fg).toBe('fg.default');
    expect(match && hasAttr(match, Attr.reverse | Attr.underline)).toBe(true);
  });

  test('every option when shown all, and a muted row when nothing matches', () => {
    expect(
      comboBoxBuffer({ cols: 20, options: AUTHORS, input: 'aur', open: true, showAll: true })
        .height,
    ).toBe(1 + AUTHORS.length + 2);
    const none = toText(comboBoxBuffer({ cols: 20, options: AUTHORS, input: 'xyz', open: true }));
    expect(none.split('\n')[2]).toBe('┃   No matches     ┃');
  });
});

describe('on a server', () => {
  test('a field: the label, the input named by it, and the button, with every glyph hidden', () => {
    const html = renderToString(
      createElement(
        ComboBox,
        { label: 'Author', placeholder: 'Find one', cols: 16 },
        // biome-ignore lint/correctness/noChildrenProp: an option's words are required, and createElement's third argument cannot type them
        createElement(ComboBoxItem, { id: 'ada', children: 'Ada Lovelace' }),
      ),
    );
    expect(html).toMatch(/<input[^>]*role="combobox"/);
    expect(html).toMatch(/<input[^>]*placeholder="Find one"/);
    expect(html).toContain('--rk-combobox-cols:16');
    expect(html).toContain('--rk-combobox-input-cols:11');
    for (const glyph of html.matchAll(/<span[^>]*class="rk-combobox-(?:end|cell|mark)"[^>]*>/g)) {
      expect(glyph[0]).toContain('aria-hidden="true"');
    }
  });
});

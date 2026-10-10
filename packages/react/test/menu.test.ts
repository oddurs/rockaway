import { Attr, type Buffer, hasAttr, toText } from '@rockaway/grid';
import { glyphsFor, themeGlyphs } from '@rockaway/tokens';
import { describe, expect, test } from 'vitest';
import {
  type MenuRow,
  menuBuffer,
  menuCols,
  menuEnd,
  menuMarks,
  menuRowStyle,
} from '../src/components/menu.pure.ts';

/** A buffer as text, each row closed by a `|` so the blank cells show. */
const drawn = (buffer: Buffer): string =>
  `\n${toText(buffer, { trimEnd: false })
    .split('\n')
    .map((row) => `${row}|`)
    .join('\n')}`;

const FILE: readonly MenuRow[] = [
  { label: 'New file', keys: 'mod+n', cursor: true },
  { label: 'Open', keys: 'mod+o' },
  { label: 'Open recent', submenu: true },
  { separator: true },
  { section: 'Danger' },
  { label: 'Delete', disabled: true },
];

describe('menuBuffer', () => {
  test('separators and section titles join the frame as tees', () => {
    expect(drawn(menuBuffer({ rows: FILE }))).toMatchInlineSnapshot(`
      "
      ┏━━━━━━━━━━━━━━━━━━┓|
      ┃▸New file  Ctrl+N ┃|
      ┃ Open      Ctrl+O ┃|
      ┃ Open recent     ▸┃|
      ┠──────────────────┨|
      ┠ Danger ──────────┨|
      ┃ Delete           ┃|
      ┗━━━━━━━━━━━━━━━━━━┛|"
    `);
  });

  test('a checkable menu reserves the check cell in every row, so the labels line up', () => {
    const labels = ['Word wrap', 'Minimap', 'Line numbers'];
    const rows: MenuRow[] = [
      { label: 'Word wrap', checked: true },
      { label: 'Minimap' },
      { label: 'Line numbers', checked: true, cursor: true },
    ];
    expect(drawn(menuBuffer({ rows }))).toMatchInlineSnapshot(`
      "
      ┏━━━━━━━━━━━━━━━┓|
      ┃ ✓Word wrap    ┃|
      ┃  Minimap      ┃|
      ┃▸✓Line numbers ┃|
      ┗━━━━━━━━━━━━━━━┛|"
    `);
    const buffer = menuBuffer({ rows });
    const starts = labels.map((label, i) => buffer.row(1 + i).indexOf(label));
    expect(new Set(starts)).toEqual(new Set([3]));
  });

  test('a submenu’s item carries the collapsed mark, and the expanded one while it is open', () => {
    expect(menuEnd({ submenu: true })).toBe(themeGlyphs.default.mark.collapsed);
    expect(menuEnd({ submenu: true, open: true })).toBe(themeGlyphs.default.mark.expanded);
    expect(menuEnd({})).toBe(' ');
  });

  test('the cursor’s row is reverse video from side to side; a disabled row is dim', () => {
    const buffer = menuBuffer({ rows: FILE });
    const width = buffer.width;
    for (let x = 1; x < width - 1; x++) {
      expect(hasAttr(buffer.at({ x, y: 1 })?.style ?? { attrs: 0 }, Attr.reverse)).toBe(true);
    }
    expect(hasAttr(buffer.at({ x: 0, y: 1 })?.style ?? { attrs: 0 }, Attr.reverse)).toBe(false);
    expect(menuRowStyle({ disabled: true })).toEqual({ fg: 'fg.disabled', attrs: Attr.dim });
    expect(menuRowStyle({ cursor: true }).attrs).toBe(Attr.reverse);
  });

  test('under ASCII every glyph is ASCII', () => {
    const ascii = glyphsFor({ borderSet: 'ascii' });
    const text = toText(menuBuffer({ rows: FILE }, ascii));
    expect(text).toMatchInlineSnapshot(`
      "+------------------+
      |>New file  Ctrl+N |
      | Open      Ctrl+O |
      | Open recent     >|
      +------------------+
      + Danger ----------+
      | Delete           |
      +------------------+"
    `);
    expect(/^[\x20-\x7e\n]*$/.test(text)).toBe(true);
  });
});

describe('menuMarks', () => {
  test('one reserved cell, or two in a checkable menu, blank when they hold nothing', () => {
    expect(menuMarks({}, false)).toEqual([' ']);
    expect(menuMarks({ cursor: true, checked: true }, true)).toEqual(['▸', '✓']);
    expect(menuMarks({ checked: true }, false)).toEqual([' ']);
  });
});

describe('menuCols', () => {
  test('wide enough for its widest row, or its widest title in its rule', () => {
    expect(menuCols([{ label: 'Cut', keys: 'mod+x' }], false)).toBe(
      2 + 1 + 'Cut'.length + 2 + 'Ctrl+X'.length + 1,
    );
    expect(menuCols([{ label: 'Cut' }, { section: 'Clipboard' }], false)).toBe(2 + 2 + 9 + 3);
  });
});

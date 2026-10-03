import { Attr, type Buffer, hasAttr, toText } from '@rockaway/grid';
import { glyphsFor } from '@rockaway/tokens';
import { describe, expect, test } from 'vitest';
import {
  type ListRow,
  listBuffer,
  listMarks,
  listRowStyle,
  scrollbarBuffer,
} from '../src/components/list.tsx';

const NAMES: ReadonlyArray<readonly [number, string]> = [
  [Attr.bold, 'bold'],
  [Attr.dim, 'dim'],
  [Attr.reverse, 'reverse'],
  [Attr.underline, 'underline'],
];

/**
 * The list as text, framed in `│` so blank cells show, with each row's runs of
 * attributes beside it: what the text cannot show, said in words.
 */
function drawn(buffer: Buffer): string {
  const text = toText(buffer, { trimEnd: false }).split('\n');
  return text
    .map((line, y) => {
      const runs: string[] = [];
      let start = 0;
      let key = '';
      for (let x = 0; x <= buffer.width; x++) {
        const cell = x < buffer.width ? buffer.at({ x, y }) : undefined;
        const next = cell
          ? NAMES.filter(([bit]) => hasAttr(cell.style, bit))
              .map(([, n]) => n)
              .join(' ')
          : '';
        if (next !== key || x === buffer.width) {
          if (key !== '') runs.push(`${start === x - 1 ? start : `${start}-${x - 1}`} ${key}`);
          start = x;
          key = next;
        }
      }
      return `│${line}│ ${runs.join(', ')}`.trimEnd();
    })
    .join('\n');
}

const FILES = ['src/index.ts', 'src/buffer.ts', 'src/junction.ts', 'src/layout.ts', 'README.md'];
const rows = (states: Record<number, Omit<ListRow, 'label'>>): ListRow[] =>
  FILES.map((label, i) => ({ label, ...states[i] }));

describe('listBuffer', () => {
  test('single select: the cursor is a mark, the selection is reverse video', () => {
    const list = listBuffer({
      rows: rows({
        0: { cursor: true },
        1: { selected: true },
        2: { hovered: true },
        3: { disabled: true },
      }),
      width: 18,
      visible: 5,
    });
    expect(drawn(list)).toMatchInlineSnapshot(`
      "│▸src/index.ts    █│
      │ src/buffer.ts   █│ 0-16 reverse
      │ src/junction.ts █│ 1-15 underline
      │ src/layout.ts   █│ 0-16 dim
      │ README.md       █│"
    `);
  });

  test('multi-select: the cursor and the check are two cells, so every pairing reads', () => {
    const list = listBuffer({
      rows: rows({
        0: { cursor: true },
        1: { selected: true },
        2: { cursor: true, selected: true },
      }),
      width: 18,
      visible: 5,
      multiple: true,
    });
    expect(drawn(list)).toMatchInlineSnapshot(`
      "│▸ src/index.ts   █│
      │ ✓src/buffer.ts  █│ 0-16 reverse
      │▸✓src/junction.ts█│ 0-16 reverse
      │  src/layout.ts  █│
      │  README.md      █│"
    `);
  });

  test('no state moves the label or changes the width', () => {
    const states: Omit<ListRow, 'label'>[] = [
      {},
      { cursor: true },
      { selected: true },
      { cursor: true, selected: true },
      { disabled: true },
      { hovered: true },
    ];
    for (const multiple of [false, true]) {
      const lines = states.map((state) =>
        toText(
          listBuffer({ rows: [{ label: 'row', ...state }], width: 10, visible: 1, multiple }),
          {
            trimEnd: false,
          },
        ),
      );
      const at = multiple ? 2 : 1;
      for (const line of lines) {
        expect(line).toHaveLength(10);
        expect(line.slice(at, at + 3)).toBe('row');
      }
    }
  });

  test('scrolled, a long label cut where its row ends, and the scrollbar following', () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ label: `line ${i} of a long list` }));
    const list = listBuffer({ rows: many, width: 14, visible: 4, offset: 8 });
    expect(drawn(list)).toMatchInlineSnapshot(`
      "│ line 8 of a ░│
      │ line 9 of a ░│
      │ line 10 of a░│
      │ line 11 of a█│"
    `);
  });

  test('an empty list says so in its first row', () => {
    expect(drawn(listBuffer({ rows: [], width: 18, visible: 3 }))).toMatchInlineSnapshot(`
      "│ Nothing here.   █│
      │                 █│
      │                 █│"
    `);
  });

  test('the ascii theme draws every mark and the scrollbar in ASCII', () => {
    const ascii = glyphsFor({ borderSet: 'ascii' });
    const list = listBuffer(
      {
        rows: rows({ 0: { cursor: true, selected: true }, 1: { selected: true } }),
        width: 18,
        visible: 3,
        multiple: true,
      },
      ascii,
    );
    expect(toText(list)).toMatchInlineSnapshot(`
      ">xsrc/index.ts   #
       xsrc/buffer.ts  #
        src/junction.ts."
    `);
    expect(toText(list)).toMatch(/^[\x20-\x7e\n]*$/);
  });

  test('the row style is what the stylesheet draws', () => {
    expect(listRowStyle({})).toEqual({ fg: 'fg.default', attrs: Attr.none });
    expect(listRowStyle({ cursor: true })).toEqual({ fg: 'fg.default', attrs: Attr.none });
    expect(listRowStyle({ selected: true })).toEqual({ fg: 'fg.default', attrs: Attr.reverse });
    expect(listRowStyle({ disabled: true, selected: true })).toEqual({
      fg: 'fg.disabled',
      attrs: Attr.reverse | Attr.dim,
    });
    expect(listMarks({ selected: true }, false)).toEqual([' ']);
  });
});

/** A scrollbar printed sideways, so a row of the snapshot is a whole bar. */
function bar(state: { total: number; visible: number; offset: number }): string {
  return toText(scrollbarBuffer(state)).split('\n').join('');
}

describe('scrollbarBuffer', () => {
  test('a thumb that moves down the track as the list scrolls', () => {
    const rows = [0, 4, 8, 12, 16].map(
      (offset) => `offset ${String(offset).padStart(2)}  ${bar({ total: 24, visible: 8, offset })}`,
    );
    expect(rows.join('\n')).toMatchInlineSnapshot(`
      "offset  0  ███░░░░░
      offset  4  ░███░░░░
      offset  8  ░░░███░░
      offset 12  ░░░░███░
      offset 16  ░░░░░███"
    `);
  });

  test('nothing to scroll is a full thumb, not an empty track', () => {
    expect(bar({ total: 4, visible: 8, offset: 0 })).toBe('████████');
    expect(bar({ total: 8, visible: 8, offset: 0 })).toBe('████████');
  });

  test('the thumb is never smaller than a cell, however long the list', () => {
    const drawn = bar({ total: 10_000, visible: 8, offset: 0 });
    expect(drawn).toHaveLength(8);
    expect(drawn.split('').filter((ch) => ch === '█')).toHaveLength(1);
  });

  test('the thumb reaches the bottom exactly at the end of the list', () => {
    const end = bar({ total: 24, visible: 8, offset: 16 });
    expect(end.endsWith('█')).toBe(true);
    expect(bar({ total: 24, visible: 8, offset: 0 }).startsWith('█')).toBe(true);
  });

  test('a viewport of no rows draws nothing', () => {
    expect(toText(scrollbarBuffer({ total: 10, visible: 0, offset: 0 }))).toBe('');
  });

  test('an offset past the end stays on the track', () => {
    expect(bar({ total: 24, visible: 8, offset: 999 })).toHaveLength(8);
  });
});

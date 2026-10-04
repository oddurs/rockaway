import { stringWidth, toText } from '@rockaway/grid';
import { glyphsFor } from '@rockaway/tokens';
import { describe, expect, test } from 'vitest';
import {
  type ColumnShape,
  fitCell,
  type TableText,
  tableBuffer,
  tableLayout,
} from '../src/components/table.tsx';

const COLUMNS: TableText['columns'] = [
  { header: 'Name', sortable: true, sort: 'ascending' },
  { header: 'Size', width: 6, align: 'end' },
  { header: 'Modified', width: '1fr' },
];

const ROWS: TableText['rows'] = [
  { cells: ['src/index.ts', '1204', '2026-10-01'], cursor: true },
  { cells: ['README.md', '340', '2026-09-12'] },
  { cells: ['package.json', '88', '2026-08-30'] },
];

const draw = (table: Partial<TableText> = {}): string =>
  toText(tableBuffer({ columns: COLUMNS, rows: ROWS, ...table }));

describe('tableBuffer', () => {
  test('three column kinds, their rules joined to the frame and the header rule', () => {
    expect(draw({ width: 44, title: 'files' })).toMatchInlineSnapshot(`
      "┌ files ───────┬────────┬──────────────────┐
      │ Name        ▴│   Size │ Modified         │
      ├──────────────┼────────┼──────────────────┤
      │▸src/index.ts │   1204 │ 2026-10-01       │
      │ README.md    │    340 │ 2026-09-12       │
      │ package.json │     88 │ 2026-08-30       │
      └──────────────┴────────┴──────────────────┘"
    `);
  });

  test('as narrow as it can be: auto to its widest value, a share at its minimum', () => {
    expect(draw()).toMatchInlineSnapshot(`
      "┌──────────────┬────────┬──────┐
      │ Name        ▴│   Size │ Mod… │
      ├──────────────┼────────┼──────┤
      │▸src/index.ts │   1204 │ 202… │
      │ README.md    │    340 │ 202… │
      │ package.json │     88 │ 202… │
      └──────────────┴────────┴──────┘"
    `);
  });

  test('selection: reverse for a selected row, and the check in a second cell under multi', () => {
    const rows: TableText['rows'] = [
      { cells: ['src/index.ts', '1204', '2026-10-01'], cursor: true, selected: true },
      { cells: ['README.md', '340', '2026-09-12'], selected: true },
      { cells: ['package.json', '88', '2026-08-30'], disabled: true },
    ];
    expect(
      [draw({ rows, selectionMode: 'single' }), draw({ rows, selectionMode: 'multiple' })].join(
        '\n',
      ),
    ).toMatchInlineSnapshot(`
      "┌──────────────┬────────┬──────┐
      │ Name        ▴│   Size │ Mod… │
      ├──────────────┼────────┼──────┤
      │▸src/index.ts │   1204 │ 202… │
      │ README.md    │    340 │ 202… │
      │ package.json │     88 │ 202… │
      └──────────────┴────────┴──────┘
      ┌───────────────┬────────┬──────┐
      │  Name        ▴│   Size │ Mod… │
      ├───────────────┼────────┼──────┤
      │▸✓src/index.ts │   1204 │ 202… │
      │ ✓README.md    │    340 │ 202… │
      │  package.json │     88 │ 202… │
      └───────────────┴────────┴──────┘"
    `);
    const buffer = tableBuffer({ columns: COLUMNS, rows, selectionMode: 'single' });
    expect(buffer.at({ x: 3, y: 3 })?.style.attrs ?? 0).toBeGreaterThan(0);
  });

  test('sorted descending, and an unsorted sortable column keeps its mark cell blank', () => {
    const columns: TableText['columns'] = [
      { header: 'Name', sortable: true },
      { header: 'Size', width: 6, align: 'end', sortable: true, sort: 'descending' },
    ];
    expect(toText(tableBuffer({ columns, rows: ROWS }))).toMatchInlineSnapshot(`
      "┌──────────────┬────────┐
      │ Name         │   Size▾│
      ├──────────────┼────────┤
      │▸src/index.ts │   1204 │
      │ README.md    │    340 │
      │ package.json │     88 │
      └──────────────┴────────┘"
    `);
  });

  test('truncation: on a grapheme, with the ellipsis, never past the rule; wide text is two cells', () => {
    const columns: TableText['columns'] = [
      { header: 'Name', width: 8 },
      { header: 'Note', width: 7 },
    ];
    const rows: TableText['rows'] = [
      { cells: ['a-very-long-file-name.ts', '日本語のメモ'] },
      { cells: ['ok', 'été – ok'] },
    ];
    const text = toText(tableBuffer({ columns, rows }));
    expect(text).toMatchInlineSnapshot(`
      "┌──────────┬─────────┐
      │ Name     │ Note    │
      ├──────────┼─────────┤
      │ a-very-… │ 日本語… │
      │ ok       │ été –…  │
      └──────────┴─────────┘"
    `);
    // Every row is the same width in cells, wide characters counted as two.
    const widths = new Set(text.split('\n').map((line) => stringWidth(line)));
    expect(widths.size).toBe(1);
  });

  test('numbers right-align on a cell boundary', () => {
    expect(fitCell('88', 6, 'end')).toBe('    88');
    expect(fitCell('1204', 6, 'end')).toBe('  1204');
    expect(fitCell('1234567', 6, 'end')).toBe('12345…');
  });

  test('empty, and in ASCII', () => {
    expect(
      [
        draw({ rows: [] }),
        toText(tableBuffer({ columns: COLUMNS, rows: ROWS }, glyphsFor({ borderSet: 'ascii' }))),
      ].join('\n'),
    ).toMatchInlineSnapshot(`
      "┌──────┬────────┬──────┐
      │ Name▴│   Size │ Mod… │
      ├──────┴────────┴──────┤
      │ Nothing here.        │
      └──────────────────────┘
      +--------------+--------+------+
      | Name        ^|   Size | Mod~ |
      +--------------+--------+------+
      |>src/index.ts |   1204 | 202~ |
      | README.md    |    340 | 202~ |
      | package.json |     88 | 202~ |
      +--------------+--------+------+"
    `);
  });
});

describe('tableLayout', () => {
  const columns: ColumnShape[] = [
    { header: 'Name' },
    { header: 'Size', width: 6 },
    { header: 'Modified', width: '2fr' },
    { header: 'Notes', width: '1fr' },
  ];

  test('fixed and auto columns keep their cells; shares split what is left, whole', () => {
    const layout = tableLayout(columns, [12, 0, 0, 0], { room: 60 });
    // The shares split what is left above their minimums, two to one.
    expect(layout.content).toEqual([12, 6, 18, 11]);
    expect(layout.width).toBe(60);
    expect(layout.overflows).toBe(false);
  });

  test('too little room: shares take their minimum, and the table overflows', () => {
    const layout = tableLayout(columns, [12, 0, 0, 0], { room: 30 });
    expect(layout.overflows).toBe(true);
    expect(layout.width).toBeGreaterThan(30);
  });

  test('rules sit between tracks, a cell each', () => {
    const layout = tableLayout(columns.slice(0, 2), [12, 0], {});
    // │ + lead 1 + 12 + trail 1 = 15, so the rule is at 15.
    expect(layout.rules).toEqual([15]);
    expect(layout.width).toBe(1 + 14 + 1 + 8 + 1);
  });
});

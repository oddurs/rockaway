import { toText } from '@rockaway/grid';
import { type ComponentMetaInput, defineMeta } from '../metadata/schema.ts';
import { tableBuffer } from './table.pure.ts';
import type { TableText } from './table.tsx';

const FILES: TableText = {
  columns: [
    { header: 'Name', sortable: true, sort: 'ascending' },
    { header: 'Size', width: 6, align: 'end', sortable: true },
    { header: 'Modified', width: '1fr' },
  ],
  rows: [
    { cells: ['LICENSE', '1071', '2026-07-04'] },
    { cells: ['README.md', '340', '2026-09-12'], cursor: true, selected: true },
    { cells: ['package.json', '88', '2026-08-30'] },
    { cells: ['src/index.ts', '1204', '2026-10-01'], selected: true },
  ],
  width: 44,
};

export const tableMeta: ComponentMetaInput = defineMeta({
  name: 'Table',
  summary:
    'Rows and columns of data in a frame, its column rules joined to the frame and the header rule.',
  description:
    "One buffer draws the frame, the header rule and the column rules, and the junction table makes every crossing; the cells are a real React Aria grid laid over it, so the arrows move between cells, Space selects, Enter sorts a focused header, and every value is announced with its column. Columns are whole cells: a cell of air (in the first, the row's reserved mark cells), the content, and a last cell that holds the sort mark in the header. Content widths are cells, shares of what is left, or as wide as the widest value (the default), solved by the layout solver. Text is cut on a grapheme with the theme's ellipsis, never past a rule, wide characters count two cells, and numbers right-align. The focused row carries the cursor mark; a selected row is reverse video, with the check in a second cell under multi-select. A table wider than its room keeps its columns and scrolls across, a column at a time, with its overflow marked.",
  whenToUse: [
    'For records with the same fields, compared down a column: files, runs, packages, results.',
    'When a reader sorts by a field, or selects rows to act on.',
  ],
  whenNotToUse: [
    { text: 'For one column of choices.', instead: 'List' },
    {
      text: 'For a layout of panes or a form: a table is data, not a grid to put things in.',
      instead: 'Frame',
    },
    { text: 'For data a reader edits in place: this is not a spreadsheet.' },
  ],
  related: [
    { name: 'List', why: 'Rows select and carry the cursor the same way.' },
    {
      name: 'Frame',
      why: 'The same box, its title in the top edge, stopping short of the first column rule.',
    },
    {
      name: 'Divider',
      why: 'The header rule and the column rules are its rule, joined by the junction table.',
    },
  ],
  anatomy: [
    {
      kind: 'import',
      name: 'Table',
      role: 'grid',
      description:
        "React Aria's Table over a screen that draws the frame and the rules. Takes `cols`, the room it has in cells, or measures its container.",
    },
    { kind: 'import', name: 'TableHeader', description: 'The header row.' },
    {
      kind: 'import',
      name: 'Column',
      role: 'columnheader',
      description:
        "A column: its header's words, `width` (cells, `'1fr'`, or `'auto'`), `align`, and `allowsSorting`.",
    },
    { kind: 'import', name: 'TableBody', description: 'The rows, and what an empty table says.' },
    { kind: 'import', name: 'Row', role: 'row', description: 'A row: a Cell per column.' },
    {
      kind: 'import',
      name: 'Cell',
      description:
        'A value. Text and numbers are cut and aligned in cells; anything else is clipped at the rule.',
    },
    {
      kind: 'element',
      name: 'chrome',
      className: 'rk-table-screen',
      chrome: true,
      description:
        'The screen under the grid: the frame, the header rule and the column rules, painted and aria-hidden.',
    },
    {
      kind: 'element',
      name: 'marks',
      className: 'rk-table-lead',
      chrome: true,
      description:
        "Each cell's first cells: air, or in the first column the row's reserved cells for the cursor and, under multi-select, the check.",
    },
    {
      kind: 'element',
      name: 'value',
      className: 'rk-table-content',
      chrome: false,
      description:
        'The value, cut and aligned to its column. A reader hears the whole of a cut value.',
    },
    {
      kind: 'element',
      name: 'sort-mark',
      className: 'rk-table-sort',
      chrome: true,
      description:
        "The header's last cell: the theme's sort mark on the sorted column, blank otherwise. The sort is announced by aria-sort.",
    },
  ],
  states: [
    {
      state: 'cursor',
      part: 'Row',
      note: 'The cursor mark in the first reserved cell, whether the row or one of its cells has focus.',
    },
    {
      state: 'selected',
      part: 'Row',
      note: 'Reverse video cell by cell, so the rules stay lines; the check in a second reserved cell under multi-select.',
    },
    {
      state: 'hover',
      part: 'Row',
      note: "The row's values underline; so do a sortable header's words.",
    },
    {
      state: 'focus-unframed',
      part: 'Cell',
      note: 'A focused header or cell has the ring; a focused row has the cursor.',
    },
    { state: 'disabled', part: 'Row' },
  ],
  accessibility: {
    name: "The table's `aria-label`, or its title. Each value is announced with its column header; the rules and marks are aria-hidden.",
    keyboard: [
      {
        keys: ['up', 'down'],
        action: 'Moves between rows, and from the first row up to the headers.',
      },
      { keys: ['left', 'right'], action: 'Moves between the cells of a row.' },
      { keys: ['home', 'end'], action: 'Moves to the first or last row.' },
      { keys: ['pageup', 'pagedown'], action: 'Moves a page of rows.' },
      { keys: ['space'], action: 'Selects the focused row.' },
      { keys: ['enter'], action: 'Sorts by the focused header.' },
      { keys: ['tab'], action: 'Leaves the table: it is one stop.' },
    ],
    typeAhead: false,
    announces:
      '"README.md, row 3, Name, selected." A header says how it is sorted, through aria-sort.',
    notes: [
      'grid, row, rowheader, gridcell and columnheader roles from React Aria.',
      'A value cut to fit its column is drawn cut and read whole.',
    ],
  },
  snapshots: [
    {
      title: 'Three column kinds',
      description:
        'Name is as wide as its widest value and sorted; Size is six cells, right-aligned; Modified takes what is left. The cursor is on README.md, which is selected with src/index.ts (reverse video, which text cannot show).',
      draw: (glyphs) => toText(tableBuffer({ ...FILES, title: 'files' }, glyphs)),
    },
    {
      title: 'Multi-select',
      description: 'A second reserved cell carries the check.',
      draw: (glyphs) => toText(tableBuffer({ ...FILES, selectionMode: 'multiple' }, glyphs)),
    },
    {
      title: 'Empty',
      description: 'The words across the table, and the column rules stop at the header rule.',
      draw: (glyphs) => toText(tableBuffer({ ...FILES, rows: [] }, glyphs)),
    },
  ],
  // Drawn by its own buffer functions: the published size is measured from these (0167).
  size: {
    // Its least: no words, or the least room its chrome needs.
    min: toText(tableBuffer({ columns: [{ header: '' }], rows: [] }), { trimEnd: false }),
    // The default variant, with words like these.
    default: toText(tableBuffer({ ...FILES, title: 'files' }), { trimEnd: false }),
  },
});

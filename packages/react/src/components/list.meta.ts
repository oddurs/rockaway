import { toText } from '@rockaway/grid';
import { type ComponentMetaInput, defineMeta } from '../metadata/schema.ts';
import { listBuffer } from './list.pure.ts';
import type { ListRow } from './list.tsx';

const FILES = ['src/index.ts', 'src/buffer.ts', 'src/junction.ts', 'src/layout.ts', 'README.md'];

/** The files, each in the state given for it by its index. */
const files = (states: Record<number, Omit<ListRow, 'label'>>): ListRow[] =>
  FILES.map((label, i) => ({ label, ...states[i] }));

export const listMeta: ComponentMetaInput = defineMeta({
  name: 'List',
  summary: 'Rows to move through and choose from, with a cursor and a scrollbar drawn in cells.',
  description:
    "The selection primitive a TUI leans on. The viewport is exactly as many rows tall as it says and scrolls in whole rows, so a list never ends mid-row. The cursor and the selection are two signals: the cursor is a mark in a cell every row reserves, and a selected row is reverse video, with a check mark in a second reserved cell under multi-select. The keyboard is React Aria's ListBox. The scrollbar is drawn by the engine into a one-cell column, from the collection's row count.",
  whenToUse: [
    'To choose one item, or several, from a set: files, commands, results.',
    'To move through a long collection a row at a time from the keyboard.',
  ],
  whenNotToUse: [
    { text: 'To perform a single action.', instead: 'Button' },
    { text: 'For a row of places to go.', instead: 'Link' },
    {
      text: 'For thousands of rows. List renders every row until it is virtualised (0115).',
    },
  ],
  related: [{ name: 'Frame', why: 'A list usually fills a pane of a frame, under its title.' }],
  anatomy: [
    {
      kind: 'import',
      name: 'List',
      role: 'listbox',
      description:
        'The viewport, the rows inside it, and the scrollbar beside them. An empty list says so in its first row.',
    },
    {
      kind: 'import',
      name: 'ListItem',
      role: 'option',
      description: 'A row: its reserved mark cells, then its label.',
    },
    {
      kind: 'element',
      name: 'cursor',
      className: 'rk-list-cursor',
      chrome: true,
      description:
        "The first reserved cell of every row, holding the theme's cursor mark on the keyboard's row and blank on the others.",
    },
    {
      kind: 'element',
      name: 'check',
      className: 'rk-list-check',
      chrome: true,
      description:
        "Under multi-select only, a second reserved cell, holding the theme's check mark on a selected row.",
    },
    {
      kind: 'element',
      name: 'label',
      className: 'rk-list-label',
      chrome: false,
      description: "The row's content, clipped at the viewport's edge rather than wrapped.",
    },
    {
      kind: 'element',
      name: 'scrollbar',
      className: 'rk-list-scrollbar',
      chrome: true,
      description:
        "A one-cell column of the theme's blocks: full for the thumb, light for the track.",
    },
    {
      kind: 'element',
      name: 'empty',
      className: 'rk-list-empty',
      chrome: false,
      description:
        "The empty state, through React Aria's renderEmptyState: `empty` (or what renderEmptyState returns) in fg.muted, after the reserved cells.",
    },
  ],
  states: [
    { state: 'hover', part: 'ListItem' },
    {
      state: 'cursor',
      part: 'ListItem',
      note: 'The mark alone, in the cursor cell: no reverse video, so a selected row under the cursor shows both signals.',
    },
    {
      state: 'selected',
      part: 'ListItem',
      note: "Reverse video as the list's own figure and ground swapped, so forced colors keeps it; under multi-select also the check mark.",
    },
    { state: 'disabled', part: 'ListItem' },
  ],
  accessibility: {
    name: "Give List an aria-label or aria-labelledby. A row's name is its text: the marks are aria-hidden.",
    keyboard: [
      { keys: ['up', 'down'], action: 'Moves the cursor a row.' },
      { keys: ['home', 'end'], action: 'Moves the cursor to the first or the last row.' },
      { keys: ['pageup', 'pagedown'], action: 'Moves the cursor a page.' },
      {
        keys: ['space', 'enter'],
        action: 'Selects the row under the cursor; under multi-select, toggles it.',
      },
      {
        keys: ['shift+up', 'shift+down'],
        action: 'Under multi-select, extends the selection a row.',
      },
      { keys: ['mod+a'], action: 'Under multi-select, selects every row.' },
      { keys: ['esc'], action: 'Clears the selection.' },
    ],
    typeAhead: true,
    announces:
      "The row's text, and whether it is selected. The scrollbar is aria-hidden: the rows carry the position.",
    notes: [
      'Selection is announced from aria-selected, never from the marks or the reverse video.',
    ],
  },
  snapshots: [
    {
      title: 'Single select',
      description:
        'The cursor on the first row; the second selected, which is reverse video (text cannot show it); the fourth disabled, which is dim.',
      text: toText(
        listBuffer({
          rows: files({ 0: { cursor: true }, 1: { selected: true }, 3: { disabled: true } }),
          width: 18,
          visible: 5,
        }),
        { trimEnd: false },
      ),
    },
    {
      title: 'Multi-select',
      description: 'Two reserved cells: two rows checked, and the cursor on the second of them.',
      text: toText(
        listBuffer({
          rows: files({ 1: { selected: true }, 2: { cursor: true, selected: true } }),
          width: 18,
          visible: 5,
          multiple: true,
        }),
        { trimEnd: false },
      ),
    },
    {
      title: 'Scrolled',
      description: 'Twelve rows in a viewport of four, scrolled to the end; long labels are cut.',
      text: toText(
        listBuffer({
          rows: Array.from({ length: 12 }, (_, i) => ({ label: `line ${i} of a long list` })),
          width: 14,
          visible: 4,
          offset: 8,
        }),
        { trimEnd: false },
      ),
    },
    {
      title: 'Empty',
      text: toText(listBuffer({ rows: [], width: 18, visible: 3 }), { trimEnd: false }),
    },
  ],
});

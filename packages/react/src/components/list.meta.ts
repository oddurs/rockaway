import { toText } from '@rockaway/grid';
import { type ComponentMetaInput, defineMeta } from '../metadata/schema.ts';
import { scrollbarBuffer } from './list.tsx';

/** A scrollbar printed sideways, so one line of the snapshot is the whole bar. */
const bar = (total: number, visible: number, offset: number): string =>
  toText(scrollbarBuffer({ total, visible, offset })).split('\n').join('');

export const listMeta: ComponentMetaInput = defineMeta({
  name: 'List',
  summary: 'Rows to move through and choose from, with a cursor and a scrollbar drawn in cells.',
  description:
    "The selection primitive a TUI leans on. The viewport is exactly as many rows tall as it says and scrolls in whole rows, so a list never ends mid-row. The keyboard is React Aria's ListBox: arrows, Home and End, the page keys and type-ahead. The scrollbar is drawn by the engine into a one-cell column.",
  whenToUse: [
    'To choose one item, or several, from a set: files, commands, results.',
    'To move through a long collection a row at a time from the keyboard.',
  ],
  whenNotToUse: [
    { text: 'To perform a single action.', instead: 'Button' },
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
      description: 'The viewport, the rows inside it, and the scrollbar beside them.',
    },
    {
      kind: 'import',
      name: 'ListItem',
      role: 'option',
      description: 'A row: the cursor cell, then the label.',
    },
    {
      kind: 'element',
      name: 'cursor',
      className: 'rk-list-cursor',
      chrome: true,
      description:
        "A reserved cell at the start of every row, holding the theme's cursor mark on the cursor's row.",
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
  ],
  states: [
    { state: 'hover', part: 'ListItem' },
    {
      state: 'cursor',
      part: 'ListItem',
      note: 'Drawn with reverse video as well as the cursor mark, exactly as selected is, so a multi-select list cannot yet show which row the cursor is on. 0133 separates them.',
    },
    {
      state: 'selected',
      part: 'ListItem',
      note: 'Reverse video and the cursor mark. The second reserved cell, for the check mark in a multi-select list, is not drawn yet (0133).',
    },
    { state: 'disabled', part: 'ListItem' },
  ],
  accessibility: {
    name: "Give List an aria-label or aria-labelledby. A row's name is its text: the cursor glyph is aria-hidden.",
    keyboard: [
      { keys: ['up', 'down'], action: 'Moves the cursor a row.' },
      { keys: ['home', 'end'], action: 'Moves the cursor to the first or the last row.' },
      { keys: ['pageup', 'pagedown'], action: 'Moves the cursor a page.' },
      {
        keys: ['space', 'enter'],
        action: 'Selects the row under the cursor, when the list is selectable.',
      },
    ],
    typeAhead: true,
    announces:
      "The row's text, and whether it is selected. The scrollbar is aria-hidden: the rows carry the position.",
    notes: [],
  },
  snapshots: [
    {
      title: 'The scrollbar as the list scrolls',
      description: 'Each line is the whole bar, printed sideways: 24 rows in a viewport of 8.',
      text: [0, 4, 8, 12, 16]
        .map((offset) => `offset ${String(offset).padStart(2)}  ${bar(24, 8, offset)}`)
        .join('\n'),
    },
    {
      title: 'Nothing to scroll, and a very long list',
      description: 'A list that fits is a full thumb; a long one still has a thumb a cell high.',
      text: [`fits     ${bar(4, 8, 0)}`, `10,000   ${bar(10_000, 8, 0)}`].join('\n'),
    },
  ],
});

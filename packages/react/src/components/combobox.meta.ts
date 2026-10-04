import { toText } from '@rockaway/grid';
import { type ComponentMetaInput, defineMeta } from '../metadata/schema.ts';
import { type ComboBoxText, comboBoxBuffer } from './combobox.pure.ts';

const AUTHORS: ComboBoxText['options'] = [
  { label: 'Ada Lovelace' },
  { label: 'Aurora Rhee' },
  { label: 'Grace Hopper' },
  { label: 'Laurent Kim' },
  { label: 'Zoë Durand', disabled: true },
];

const cells = (text: Omit<ComboBoxText, 'cols' | 'options'>): string =>
  toText(comboBoxBuffer({ cols: 18, options: AUTHORS, ...text }));

export const comboBoxMeta: ComponentMetaInput = defineMeta({
  name: 'ComboBox',
  summary: 'Type to filter a list too long to scan, and choose one value from what is left.',
  description:
    "A field: its label in the label column, and in the control column a box exactly `cols` cells wide. The box is a text field's, the text between the control delimiters with a cell either side for the overflow marks, then the open mark and the closing delimiter; those last three cells are the button that opens the whole list. The text starts in the third cell, as a Select's value does. The popover opens on the row under the box, at least as wide as it, its rows List's: the cursor mark, the selected row in reverse with the check. Where the typed text matches a row, those characters are underlined, bold and in the accent; when nothing matches, a muted row says so. React Aria's ComboBox filters without case or accents, keeps focus in the box while the arrows move the cursor, and announces the count of options as it changes.",
  whenToUse: [
    'To choose one value from a list too long to scan: an author, a file, a timezone from four hundred.',
    'In a form, where the value is submitted with the rest.',
  ],
  whenNotToUse: [
    { text: 'For a handful of options a reader should see at once: a radio group.' },
    { text: 'For a list short enough to scan without typing.', instead: 'Select' },
    { text: 'For commands rather than a value: a command palette.' },
    { text: 'For free text with no list to choose from.', instead: 'TextField' },
  ],
  related: [
    {
      name: 'Select',
      why: 'The same field and popover, for a list a reader scans rather than filters.',
    },
    { name: 'TextField', why: 'The box is a text field’s, its text scrolling by whole cells.' },
    { name: 'List', why: "The popover's rows are List's rows: cursor, reverse, check." },
  ],
  anatomy: [
    {
      kind: 'import',
      name: 'ComboBox',
      description:
        "React Aria's ComboBox as a field: the Label, the box, the description and the error, and the popover of options. Takes `cols`, the box's width in cells, and `items` for a function child, which it filters as you type.",
    },
    {
      kind: 'import',
      name: 'ComboBoxItem',
      description:
        "An option: List's row, its two reserved cells the cursor's and the check's, and its words with what the typed text matches underlined and bold.",
    },
    {
      kind: 'element',
      name: 'box',
      className: 'rk-combobox-box',
      chrome: false,
      description:
        'A React Aria Group round the input and the button, which the popover is anchored to.',
    },
    {
      kind: 'element',
      name: 'input',
      className: 'rk-combobox-input',
      chrome: false,
      description:
        'The input: `cols - 5` cells across on bg.subtle, scrolling by whole cells, with no box of its own.',
    },
    {
      kind: 'element',
      name: 'button',
      className: 'rk-combobox-button',
      chrome: false,
      description:
        'The last three cells: the end’s overflow cell, the open mark and the closing delimiter. Opens every option. Named by React Aria and out of the tab order.',
    },
    {
      kind: 'element',
      name: 'delimiters',
      className: 'rk-combobox-end',
      chrome: true,
      description: "The theme's control delimiters. aria-hidden.",
    },
    {
      kind: 'element',
      name: 'overflow cells',
      className: 'rk-combobox-cell',
      chrome: true,
      description:
        "A cell either side of the text: air, or the theme's overflow mark while text is hidden that way. aria-hidden.",
    },
    {
      kind: 'element',
      name: 'open-mark',
      className: 'rk-combobox-mark',
      chrome: true,
      description: "The theme's expanded mark, before the closing delimiter. aria-hidden.",
    },
    {
      kind: 'element',
      name: 'match',
      className: 'rk-combobox-match',
      chrome: false,
      description: 'What the typed text matches in a row: underlined, bold and in fg.accent.',
    },
    {
      kind: 'element',
      name: 'empty',
      className: 'rk-combobox-empty',
      chrome: false,
      description: 'The row the popover shows when nothing matches, muted.',
    },
    { kind: 'import', name: 'Label', description: "The field's name, with the required mark." },
    { kind: 'import', name: 'Description', description: 'Help under the box.' },
    { kind: 'import', name: 'FieldError', description: 'Why it is invalid, under the box.' },
  ],
  states: [
    { state: 'focus-unframed', part: 'ComboBox', note: 'The input has the ring.' },
    { state: 'hover', part: 'ComboBox', note: 'Over the button, the open mark underlines.' },
    { state: 'pressed', part: 'ComboBox', note: 'The open mark in reverse video.' },
    {
      state: 'invalid',
      part: 'ComboBox',
      note: 'The delimiters in border.danger, and the error with its cross under the field.',
    },
    { state: 'disabled', part: 'ComboBox', note: 'The text, the mark and the delimiters dim.' },
    {
      state: 'selected',
      part: 'ComboBoxItem',
      note: "List's: the row in reverse video, with the check; a match in it keeps the row's colour.",
    },
  ],
  accessibility: {
    name: 'The input is named by the label. The delimiters, the overflow cells and the open mark are aria-hidden; the button is named by React Aria.',
    keyboard: [
      {
        keys: ['down', 'up'],
        action: 'Opens the list; open, moves the cursor, focus staying in the box.',
      },
      { keys: ['enter'], action: 'Chooses the option under the cursor and closes.' },
      { keys: ['esc'], action: 'Closes the list; closed, clears the text.' },
    ],
    typeAhead: false,
    announces:
      '"Author, combo box, aur". As the list filters, "2 options available"; on an option, "Aurora Rhee, 1 of 2".',
    notes: [
      'Filtering compares without case or accents: "zu" finds "Zürich".',
      'The matched characters are part of the option’s name, not a separate announcement.',
      'With nothing matching the list stays open and says so, rather than closing as if there were no list.',
    ],
  },
  snapshots: [
    {
      title: 'Closed',
      description: 'The text in the third cell; the placeholder, muted, while nothing is typed.',
      text: [
        cells({ placeholder: 'Find an author' }),
        cells({ input: 'Grace Hopper', selected: 'Grace Hopper' }),
      ].join('\n'),
    },
    {
      title: 'Filtering',
      description:
        'Typing `aur` keeps the options it matches, and underlines and bolds the match in each, which text cannot show; the cursor is on the first.',
      text: cells({ input: 'aur', open: true, cursor: 'Aurora Rhee' }),
    },
    {
      title: 'Nothing matches',
      text: cells({ input: 'xyz', open: true }),
    },
  ],
});

import { toText } from '@rockaway/grid';
import { type ComponentMetaInput, defineMeta } from '../metadata/schema.ts';
import { selectBuffer, selectTriggerBuffer } from './select.pure.ts';
import type { SelectText } from './select.tsx';

const THEMES: SelectText['options'] = [
  { label: 'default' },
  { label: 'ink' },
  { label: 'phosphor' },
  { label: 'ice', disabled: true },
  { label: 'tokyo-night' },
];

export const selectMeta: ComponentMetaInput = defineMeta({
  name: 'Select',
  summary: `One value from a list too long for radios: \`${toText(selectTriggerBuffer('phosphor', 16))}\`.`,
  description:
    "A field: its label in the label column, and in the control column a trigger exactly `cols` cells wide, the value between the control delimiters with a cell of air either side and the open mark before the closing one. The value starts in the trigger's third cell. The popover opens on the row under the trigger, its left edge in the trigger's first column, so its rows start in the value's column, and it is at least as wide as the trigger. Its rows are List's: the cursor mark in the first reserved cell, the selected row in reverse video with the check in the second. No state changes a cell: hover underlines the value, a press reverses it, invalid draws the delimiters in border.danger with the error under the field, disabled dims, and a placeholder is muted. React Aria's Select does the rest: type-ahead with it closed, a hidden native select for forms and autofill.",
  whenToUse: [
    'To choose one value from more options than radios can show at once: a theme, a branch, a language.',
    'In a form, where the value is submitted with the rest.',
  ],
  whenNotToUse: [
    { text: 'For two to about six options a reader should see together: a radio group.' },
    { text: 'For a long list the reader filters by typing: a combobox.' },
    { text: 'For actions rather than a value: a menu.' },
  ],
  related: [
    { name: 'List', why: "The popover's rows are List's rows: cursor, reverse, check." },
    { name: 'Form', why: 'A select is a field: it lines up in the control column.' },
  ],
  anatomy: [
    {
      kind: 'import',
      name: 'Select',
      description:
        "React Aria's Select as a field: the Label, the trigger, the description and the error, and the popover. Takes `cols`, the trigger's width in cells.",
    },
    {
      kind: 'import',
      name: 'SelectItem',
      description:
        "An option: List's row, its two reserved cells the cursor's and the check's, and its words.",
    },
    {
      kind: 'element',
      name: 'trigger',
      className: 'rk-select-trigger',
      chrome: false,
      description: 'The button that opens the popover, named by the label and the value.',
    },
    {
      kind: 'element',
      name: 'delimiters',
      className: 'rk-select-end',
      chrome: true,
      description:
        "The theme's control delimiters, the opening one with a cell of air after it. aria-hidden.",
    },
    {
      kind: 'element',
      name: 'value',
      className: 'rk-select-value',
      chrome: true,
      description:
        'The value as drawn: cut with the ellipsis and padded to its cells, aria-hidden; a reader is given the whole value beside it.',
    },
    {
      kind: 'element',
      name: 'open-mark',
      className: 'rk-select-mark',
      chrome: true,
      description: "The theme's expanded mark, the cell before the closing delimiter. aria-hidden.",
    },
    {
      kind: 'import',
      name: 'Label',
      description:
        "The field's name in the label column, with the required mark when it is required.",
    },
    { kind: 'import', name: 'Description', description: 'Help under the trigger.' },
    { kind: 'import', name: 'FieldError', description: 'Why it is invalid, under the trigger.' },
  ],
  states: [
    { state: 'hover', part: 'Select', note: 'The value underlines.' },
    { state: 'focus-unframed', part: 'Select', note: 'The trigger has the ring.' },
    { state: 'pressed', part: 'Select', note: 'The value in reverse video.' },
    {
      state: 'invalid',
      part: 'Select',
      note: 'The delimiters in border.danger, and the error with its cross under the field.',
    },
    { state: 'disabled', part: 'Select' },
    {
      state: 'selected',
      part: 'SelectItem',
      note: "List's: the row in reverse video, with the check in its second reserved cell.",
    },
    {
      state: 'placeholder',
      part: 'Select',
      note: 'With nothing chosen, the placeholder is muted.',
    },
  ],
  accessibility: {
    name: 'The trigger is named by the label and the value; the delimiters, the padding and the mark are aria-hidden, and a cut value is given whole.',
    keyboard: [
      { keys: ['space'], action: 'Opens the popover, the cursor on the value.' },
      {
        keys: ['down', 'up'],
        action: 'Opens it; open, moves the cursor, skipping disabled options.',
      },
      { keys: ['enter'], action: 'Chooses the option under the cursor and closes.' },
      { keys: ['esc'], action: 'Closes without choosing.' },
    ],
    typeAhead: true,
    announces: '"Theme, phosphor, button". Open: "listbox, phosphor, selected, 3 of 5".',
    notes: [
      'Type-ahead chooses an option with the popover closed.',
      'A hidden native select carries the value in a form and for autofill.',
      'Native validation by default: a required select with nothing chosen stops the submit.',
    ],
  },
  snapshots: [
    {
      title: 'Closed',
      description: 'The value in the third cell; the placeholder, muted, when nothing is chosen.',
      text: [
        toText(selectBuffer({ cols: 16, options: THEMES, value: 'phosphor' })),
        toText(selectBuffer({ cols: 16, options: THEMES, placeholder: 'Choose one' })),
      ].join('\n'),
    },
    {
      title: 'Open',
      description:
        "The popover under the trigger, its rows from the value's column: the cursor on ink, phosphor selected (reverse video, which text cannot show) with its check.",
      text: toText(
        selectBuffer({ cols: 16, options: THEMES, value: 'phosphor', open: true, cursor: 'ink' }),
      ),
    },
  ],
  // Drawn by its own buffer functions: the published size is measured from these (0167).
  size: {
    // Its least: a one-cell value in its delimiters, closed.
    min: toText(selectBuffer({ cols: 1, options: [{ label: 'x' }], value: 'x' }), {
      trimEnd: false,
    }),
    // The default: a theme chosen, closed.
    default: toText(selectBuffer({ cols: 16, options: THEMES, value: 'phosphor' }), {
      trimEnd: false,
    }),
  },
});

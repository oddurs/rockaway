import { toText } from '@rockaway/grid';
import { type ComponentMetaInput, defineMeta, describeVariants } from '../metadata/schema.ts';
import {
  type RadioGroupText,
  type RadioText,
  radioBuffer,
  radioGroupBuffer,
  radioGroupVariants,
} from './radio-group.tsx';

const BRANCHES: readonly RadioText[] = [
  { label: 'main', selected: true },
  { label: 'develop' },
  { label: 'release' },
];

const group = (options: Partial<RadioGroupText> = {}): string =>
  toText(radioGroupBuffer({ label: 'Branch', options: BRANCHES, width: 32, ...options }));

export const radioGroupMeta: ComponentMetaInput = defineMeta({
  name: 'RadioGroup',
  summary: `One choice out of a few, all in view: \`${toText(radioBuffer('main', { selected: true }))}  ${toText(radioBuffer('develop'))}\`.`,
  description:
    "A fieldset whose label is set into its frame's top edge, with a radio for each option inside it. A radio is its mark cell, a cell of air and its words. The mark is the state: the theme's filled radio when chosen, in fg.accent, and its empty one when not, so an unchosen option is still a visible mark and neither needs a colour. Vertical groups put a radio on each row; horizontal ones set them two cells apart and wrap whole radios to the next row. No state adds a cell: pressing reverses the mark cell, invalid draws the marks in fg.danger with the frame heavy and the error under it, read-only keeps the chosen mark and leaves the empty ones out, disabled dims.",
  whenToUse: [
    'To choose one of two to about six options that should all be seen at once.',
    'When the options are worth comparing side by side before choosing.',
  ],
  whenNotToUse: [
    { text: 'For a long list, or one that grows.', instead: 'List' },
    {
      text: 'For an on/off setting that applies at once, rather than a choice among options: a switch.',
    },
    {
      text: 'For choices that do not exclude each other: a checkbox each.',
    },
  ],
  related: [
    { name: 'Fieldset', why: 'The group is a Fieldset: its frame, its legend and its states.' },
    { name: 'Form', why: 'A radio group is a field: it sits in the control column of a form.' },
  ],
  anatomy: [
    {
      kind: 'import',
      name: 'RadioGroup',
      role: 'radiogroup',
      description:
        "React Aria's RadioGroup, a field, with a Fieldset inside it: the frame, the label in its edge, and the radios.",
    },
    {
      kind: 'import',
      name: 'Radio',
      role: 'radio',
      description:
        "React Aria's RadioField and RadioButton: the label element that holds the hidden input, the mark and the words, and takes the pointer.",
    },
    {
      kind: 'element',
      name: 'options',
      className: 'rk-radio-options',
      chrome: false,
      description:
        'The radios, a row each or across, two cells apart, wrapping whole radios. Carries the orientation.',
    },
    {
      kind: 'element',
      name: 'mark',
      className: 'rk-radio-mark',
      chrome: true,
      description:
        "One cell: the theme's filled radio when chosen, its empty one when not, blank when read-only and not chosen. aria-hidden.",
    },
    {
      kind: 'element',
      name: 'label',
      className: 'rk-radio-label',
      chrome: false,
      description: "The option's words, after a cell of air: the radio's accessible name.",
    },
    {
      kind: 'import',
      name: 'Fieldset',
      description: "The group's frame, its label set into the top edge with the required mark.",
    },
    {
      kind: 'import',
      name: 'Description',
      description: 'Help for the group, dim, under the frame, linked by aria-describedby.',
    },
    {
      kind: 'import',
      name: 'FieldError',
      description: 'Why the group is invalid, under the frame: the cross and the message.',
    },
  ],
  variants: describeVariants(radioGroupVariants, {
    orientation: {
      description: 'How the radios are set out, and which arrow keys move between them.',
      values: {
        vertical: 'A radio on each row; up and down move.',
        horizontal:
          'Across, two cells apart, wrapping whole radios to the next row; left and right move.',
      },
    },
  }),
  states: [
    {
      state: 'checked',
      part: 'Radio',
      note: 'A radio has no delimiters: the filled mark when chosen and the empty one when not, the chosen one in fg.accent.',
    },
    { state: 'hover', part: 'Radio' },
    {
      state: 'focus-unframed',
      part: 'Radio',
      note: 'The input is visually hidden, so the ring is drawn round the mark and the words. Tab reaches the chosen radio, or the first.',
    },
    { state: 'pressed', part: 'Radio', note: 'The mark cell reverses.' },
    { state: 'disabled', part: 'Radio' },
    {
      state: 'invalid',
      part: 'Radio',
      note: "Every mark in fg.danger; the group's frame goes heavy and the error is drawn under it.",
    },
    {
      state: 'read-only',
      part: 'Radio',
      note: 'The value without the control: the chosen mark stays, the empty marks are left out and their cells kept.',
    },
  ],
  accessibility: {
    name: "The group is named by its label, which a reader hears from a visually hidden label rather than the frame's edge; each radio by its words. Marks and the frame are aria-hidden.",
    keyboard: [
      { keys: ['tab'], action: 'Enters the group at the chosen radio, or the first; leaves it.' },
      { keys: ['down', 'right'], action: 'Moves to the next radio and chooses it.' },
      { keys: ['up', 'left'], action: 'Moves to the previous radio and chooses it.' },
      { keys: ['space'], action: 'Chooses the focused radio.' },
    ],
    typeAhead: false,
    announces: '"Branch, radio group, required. main, radio button, checked, 1 of 3."',
    notes: [
      'radiogroup and radio roles, native radio inputs, from React Aria.',
      'The description and the error are linked to the group by aria-describedby.',
    ],
  },
  snapshots: [
    {
      title: 'Vertical',
      description: 'A radio on each row: the chosen one filled, the others empty.',
      text: group(),
    },
    {
      title: 'Horizontal',
      description: 'Across, two cells apart.',
      text: group({ orientation: 'horizontal' }),
    },
    {
      title: 'Required and invalid',
      description: 'The mark after the label, and the frame heavy.',
      text: group({ orientation: 'horizontal', required: true, invalid: true }),
    },
    {
      title: 'Read-only',
      description: 'The value without the control: only the chosen mark is drawn.',
      text: group({ orientation: 'horizontal', readOnly: true }),
    },
  ],
});

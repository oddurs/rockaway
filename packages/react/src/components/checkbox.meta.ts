import { toText } from '@rockaway/grid';
import { type ComponentMetaInput, defineMeta } from '../metadata/schema.ts';
import { type CheckboxTextOptions, checkboxBuffer } from './checkbox.tsx';

const row = (label: string, options: CheckboxTextOptions): string =>
  toText(checkboxBuffer(label, options), { trimEnd: false });

export const checkboxMeta: ComponentMetaInput = defineMeta({
  name: 'Checkbox',
  summary: 'One yes-or-no choice, the box and its words on one row.',
  description:
    "A row of text: the control's delimiters around a mark cell, a cell of air, the words, and the cell a required mark takes. The mark cell holds the theme's check, its dash when indeterminate, or a blank, so the three states differ in a glyph and read without colour. The whole row is the label React Aria wraps the native checkbox in, so pressing anywhere on it toggles it. Several checkboxes under one name are a CheckboxGroup: a Fieldset with the name set into its frame's top edge.",
  whenToUse: [
    'For a choice that is submitted with a form: sign the commit, include tags.',
    'As a CheckboxGroup, for several independent choices under one name.',
    'Indeterminate, for a box that stands for others some of which are checked.',
  ],
  whenNotToUse: [
    { text: 'For one choice out of several that exclude each other.', instead: 'List' },
    { text: 'To group fields that are not checkboxes.', instead: 'Fieldset' },
  ],
  related: [
    { name: 'Fieldset', why: 'A CheckboxGroup is a Fieldset, its name in the frame’s top edge.' },
    { name: 'Form', why: 'A checkbox sits in a form’s control column: it carries its own words.' },
  ],
  anatomy: [
    {
      kind: 'import',
      name: 'Checkbox',
      description:
        "React Aria's CheckboxField and CheckboxButton: the row, the native checkbox hidden inside it, and the description and error under it.",
    },
    {
      kind: 'import',
      name: 'CheckboxGroup',
      role: 'group',
      description:
        "React Aria's CheckboxGroup around a Fieldset: the group a reader enters, named by the label in its edge.",
    },
    {
      kind: 'element',
      name: 'row',
      className: 'rk-checkbox-row',
      chrome: false,
      description: 'The whole row, one cell tall: pressing anywhere on it toggles the box.',
    },
    {
      kind: 'element',
      name: 'box',
      className: 'rk-checkbox-box',
      chrome: true,
      description: 'The delimiters and the mark cell between them.',
    },
    {
      kind: 'element',
      name: 'mark',
      className: 'rk-checkbox-mark',
      chrome: true,
      description: 'The check, the dash, or a blank, in fg.accent.',
    },
    {
      kind: 'element',
      name: 'words',
      className: 'rk-checkbox-label',
      chrome: false,
      description: 'The checkbox’s name.',
    },
    {
      kind: 'element',
      name: 'required-mark',
      className: 'rk-label-mark',
      chrome: true,
      description:
        'The cell after the words: `*` when the box is required, blank otherwise. In a group the legend carries it.',
    },
  ],
  states: [
    { state: 'checked', part: 'Checkbox', note: 'The check, or the dash when indeterminate.' },
    { state: 'hover', part: 'Checkbox', note: 'The words underline.' },
    {
      state: 'focus-unframed',
      part: 'Checkbox',
      note: 'The ring is drawn around the row, since the native checkbox it is on is hidden.',
    },
    { state: 'pressed', part: 'Checkbox', note: 'The box reverses.' },
    { state: 'disabled', part: 'Checkbox' },
    {
      state: 'invalid',
      part: 'Checkbox',
      note: 'The delimiters go border.danger; the error row says why.',
    },
    { state: 'required', part: 'Checkbox' },
    {
      state: 'read-only',
      part: 'Checkbox',
      note: 'The delimiters’ cells are blank: the mark alone.',
    },
  ],
  accessibility: {
    name: 'The words after the box. The delimiters, the mark and the required mark are aria-hidden; the state is announced by the checkbox role.',
    keyboard: [{ keys: ['space'], action: 'Toggles the box.' }],
    typeAhead: false,
    announces: '"Sign commits, checkbox, checked". Indeterminate is announced as "mixed".',
    notes: ['In a group, Tab moves from box to box; each is its own stop.'],
  },
  snapshots: [
    {
      title: 'Checked, unchecked, indeterminate',
      description:
        'The three differ in the mark cell and nowhere else. A required box draws its mark after the words; a read-only one drops the delimiters.',
      text: [
        row('Sign commits', { mark: 'checked' }),
        row('Sign commits', { mark: 'unchecked' }),
        row('Sign commits', { mark: 'indeterminate' }),
        row('Sign commits', { mark: 'checked', required: true }),
        row('Sign commits', { mark: 'checked', readOnly: true }),
      ].join('\n'),
    },
  ],
});

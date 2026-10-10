import { toText } from '@rockaway/grid';
import { type ComponentMetaInput, defineMeta } from '../metadata/schema.ts';
import { type SwitchState, switchBuffer } from './switch.tsx';

const cells = (state: SwitchState = {}, label = 'Wrap lines'): string =>
  toText(switchBuffer(label, state), { trimEnd: false });

export const switchMeta: ComponentMetaInput = defineMeta({
  name: 'Switch',
  summary: `An on/off setting that takes effect at once: \`${cells({ selected: true })}\`.`,
  description:
    "A three-cell track between the control delimiters, the thumb in one of its cells: at the start when off, at the end when on, where the track is reverse video as well. So the two states differ in a glyph's place and in an attribute, and neither needs a colour. The label is the switch's own words, after a cell of air, and never changes with the state. No state adds a cell: pressing reverses the track (an on track back), read-only draws the thumb without the track or its ground, disabled dims. The root is a field, so a switch lines up in a Form's control column with its description under it.",
  whenToUse: [
    'For a setting that is applied the moment it changes: wrap lines, show hidden files, notifications.',
    'In a settings pane, one setting to a row, each with its description under it.',
  ],
  whenNotToUse: [
    {
      text: 'For a choice that is submitted with a form, or that has to be made before it can be: a checkbox is a value, a switch is an action.',
    },
    { text: 'To choose one of a few options.', instead: 'List' },
    { text: 'To do something once, rather than to set something that stays.', instead: 'Button' },
  ],
  related: [
    {
      name: 'Form',
      why: 'A switch is a field: it sits in the control column, its description under it.',
    },
    { name: 'Button', why: 'Shares the control delimiters and the reverse video of a press.' },
  ],
  anatomy: [
    {
      kind: 'import',
      name: 'Switch',
      role: 'switch',
      description:
        "React Aria's SwitchField, a field, with its SwitchButton inside: the label element that holds the hidden input, the track and the words, and takes the pointer.",
    },
    {
      kind: 'element',
      name: 'delimiters',
      className: 'rk-switch-end',
      chrome: true,
      description: "The theme's control delimiters, either side of the track, in border.control.",
    },
    {
      kind: 'element',
      name: 'track',
      className: 'rk-switch-track',
      chrome: true,
      description:
        "Three painted cells: the theme's thumb mark in one, its track mark in the others. The line is a shape the cell strokes, not the font's; reverse video when on.",
    },
    {
      kind: 'element',
      name: 'label',
      className: 'rk-switch-label',
      chrome: false,
      description:
        "The switch's words, after a cell of air: its accessible name, and the same in both states. A long label wraps under its own first word.",
    },
    {
      kind: 'import',
      name: 'Description',
      description: 'Help for the setting, dim, under the switch, linked by aria-describedby.',
    },
  ],
  states: [
    {
      state: 'selected',
      part: 'Switch',
      note: 'On: the thumb at the end of the track, and the track in reverse video. No check mark: the thumb is the mark.',
    },
    {
      state: 'pressed',
      part: 'Switch',
      note: 'The track reverses; an on track, already filled, reverses back.',
    },
    { state: 'hover', part: 'Switch' },
    {
      state: 'focus-unframed',
      part: 'Switch',
      note: 'The input is visually hidden, so the ring is drawn round what is seen, the track and the label.',
    },
    { state: 'disabled', part: 'Switch' },
    {
      state: 'read-only',
      part: 'Switch',
      note: 'The thumb alone, in the place it holds, without the track’s line or ground.',
    },
    {
      state: 'invalid',
      part: 'Switch',
      note: 'Only from a Form’s server errors, by name: the delimiters go border.danger and the error is drawn under the switch. A switch has nothing of its own to validate.',
    },
  ],
  accessibility: {
    name: "The label's words. The delimiters and the track are aria-hidden, so the name never contains a glyph.",
    keyboard: [{ keys: ['space'], action: 'Turns it on or off.' }],
    typeAhead: false,
    announces: '"Wrap lines, switch, on." The description follows, from aria-describedby.',
    notes: [
      'role="switch" with aria-checked, on a native checkbox input, from React Aria.',
      'Clicking anywhere on the track or the words toggles it, so the target is the whole row.',
    ],
  },
  snapshots: [
    {
      title: 'Off and on',
      description:
        'The thumb moves from the first cell of the track to the last; on is also reverse video, which text cannot show.',
      text: [cells(), cells({ selected: true })].join('\n'),
    },
    {
      title: 'Read-only',
      description: 'The value without the track: the thumb alone, in the cell it holds.',
      text: [cells({ readOnly: true }), cells({ selected: true, readOnly: true })].join('\n'),
    },
  ],
});

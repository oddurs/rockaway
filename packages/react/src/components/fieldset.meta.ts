import { toText } from '@rockaway/grid';
import { type ComponentMetaInput, defineMeta, describeVariants } from '../metadata/schema.ts';
import { fieldFrameBuffer, fieldFrameVariants } from './fieldset.pure.ts';
import type { FieldFrameState } from './fieldset.tsx';

const frame = (state: Omit<FieldFrameState, 'label'>): string =>
  toText(fieldFrameBuffer({ width: 24, height: 3 }, { label: 'Notify', ...state }), {
    trimEnd: false,
  });

export const fieldsetMeta: ComponentMetaInput = defineMeta({
  name: 'Fieldset',
  summary: 'A framed group whose legend is set into the top edge of its frame.',
  description:
    "A field with a frame has no label column: its label goes into the frame's top edge, the way a terminal titles a pane. The engine draws it there, truncated before the corner, and a reader hears a real label with the same words and no glyph. FieldFrame is that frame, for a control drawn in one; Fieldset is a FieldFrame that is a group, named by its legend. Inside a React Aria checkbox or radio group, a Fieldset is that group's frame, and draws the group's invalid and disabled states; the group's `isRequired` is passed to it, as a field's is to its Label.",
  whenToUse: [
    'To frame a group of checkboxes or radios, with the group’s label in the edge.',
    'To gather related fields in a form under a name: an address, a schedule.',
    'With FieldFrame, to draw a framed control (an `lg` text field) with its label in the edge.',
  ],
  whenNotToUse: [
    { text: 'To box something that is not a field or a group of them.', instead: 'Frame' },
    { text: 'For a one-row control, whose label sits beside it.', instead: 'Form' },
  ],
  related: [
    {
      name: 'Frame',
      why: 'Draws the box; a field frame sets its label the way a frame sets a title.',
    },
    { name: 'Form', why: 'Fields inside a fieldset line up the way a form’s do.' },
  ],
  anatomy: [
    {
      kind: 'import',
      name: 'Fieldset',
      role: 'group',
      description:
        'A FieldFrame that is a group named by its legend. Inside a React Aria group, the group keeps the role and the legend becomes its label.',
    },
    {
      kind: 'import',
      name: 'FieldFrame',
      description:
        'The frame and the label in its edge, on React Aria’s Group, which writes the state attributes the frame is coloured from.',
    },
    {
      kind: 'element',
      name: 'label',
      className: 'rk-field-frame-label',
      chrome: false,
      description:
        'The label a reader hears: the edge’s words, visually hidden, taking the field’s or the group’s ids.',
    },
    {
      kind: 'element',
      name: 'fields',
      className: 'rk-fieldset-fields',
      chrome: false,
      description: 'What the fieldset holds. Fields in it line up in two columns, as in a form.',
    },
  ],
  variants: describeVariants(fieldFrameVariants, {
    kind: {
      description: 'Whose frame it is, which decides whether focus inside it is drawn on it.',
      values: {
        control:
          "A control's own frame (an `lg` text field). Focus inside it makes it heavy, in border.focus.",
        group:
          'A frame around several controls, each of which shows its own focus. Fieldset is always this.',
      },
    },
  }),
  states: [
    {
      state: 'invalid',
      part: 'FieldFrame',
      note: 'Heavy, in border.danger. Under the ascii border set there is no heavier line, and the colour and the error row carry it.',
    },
    { state: 'disabled', part: 'FieldFrame', note: 'The frame and the label in its edge dim.' },
    {
      state: 'focus-framed',
      part: 'FieldFrame',
      note: 'Only on a `control` frame. Focus outranks invalid while it lasts.',
    },
  ],
  accessibility: {
    name: "The legend's words, through a visually hidden label; the frame and the label drawn in its edge are aria-hidden.",
    keyboard: [],
    typeAhead: false,
    announces: '"Notify, group", as a reader enters it.',
    notes: [
      'The required mark in the edge is chrome. Inside a group, the group says it is required.',
      "Fieldset's `isDisabled` dims the frame and nothing else; a React Aria group's `isDisabled` disables what is in it as well.",
    ],
  },
  snapshots: [
    {
      title: 'Every state',
      description:
        'Required puts the mark after the legend; invalid and focus make the line heavy. None changes the size.',
      text: [
        frame({}),
        frame({ required: true }),
        frame({ invalid: true }),
        frame({ focused: true }),
      ].join('\n'),
    },
  ],
});

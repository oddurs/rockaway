import { toText } from '@rockaway/grid';
import { type ComponentMetaInput, defineMeta, describeVariants } from '../metadata/schema.ts';
import { formBuffer } from './field.pure.ts';
import {
  type TextFieldTextOptions,
  textFieldBuffer,
  textFieldVariants,
} from './text-field.pure.ts';

const box = (options: TextFieldTextOptions): string =>
  toText(textFieldBuffer({ cols: 16, ...options }), { trimEnd: false });

const LONG = 'a value far longer than its box';

export const textFieldMeta: ComponentMetaInput = defineMeta({
  name: 'TextField',
  summary: 'Free text in a box exactly `cols` cells wide, on one row or several.',
  description:
    "The terminal form field, built from the field contract. A `md` box is the control's delimiters around `cols` cells of text on bg.subtle, with the label beside it; a `lg` box is a frame with the label set into its top edge; a `multiline` box is that frame, `rows` tall, with a scrollbar column. Text longer than the box scrolls inside it by whole cells, and the theme's overflow marks stand in the cells either side while text is hidden that way: the box never grows, and no native scrollbar is ever drawn.",
  whenToUse: [
    'For a value a reader types: a name, a path, a search, a commit message.',
    'As `lg` where the label belongs on the box rather than beside it, or the field stands alone.',
    'As `multiline` for text of several lines.',
  ],
  whenNotToUse: [
    { text: 'To choose one value from a known set.', instead: 'List' },
    { text: 'To group several fields under one name.', instead: 'Fieldset' },
  ],
  related: [
    {
      name: 'Form',
      why: 'Lines a text field up with the others: its box starts where every control does.',
    },
    { name: 'Fieldset', why: 'Its FieldFrame is the frame a `lg` or `multiline` box is drawn in.' },
  ],
  anatomy: [
    {
      kind: 'import',
      name: 'TextField',
      description:
        "React Aria's TextField with the field contract's parts: Label, the box, Description and FieldError.",
    },
    {
      kind: 'element',
      name: 'box',
      className: 'rk-text-field-box',
      chrome: false,
      description: 'The input or text area and the cells either side of it.',
    },
    {
      kind: 'element',
      name: 'input',
      className: 'rk-text-field-input',
      chrome: false,
      description:
        'Exactly `cols` cells across and one row down, on bg.subtle. No border, padding or scrollbar of its own. A placeholder is dim, on the ground, so it is never mistaken for read-only text.',
    },
    {
      kind: 'element',
      name: 'area',
      className: 'rk-text-field-area',
      chrome: false,
      description: '`multiline`: `cols` cells across and `rows` down, scrolled by whole rows.',
    },
    {
      kind: 'element',
      name: 'ends',
      className: 'rk-text-field-end',
      chrome: true,
      description:
        "The cell either side of the text: the delimiters of a `md` box, air in a framed one, and the theme's overflow marks while text is hidden that way.",
    },
    {
      kind: 'element',
      name: 'scrollbar',
      className: 'rk-text-field-scrollbar',
      chrome: true,
      description: "`multiline`: the scrollbar, drawn in a cell column by List's scrollbarBuffer.",
    },
    {
      kind: 'element',
      name: 'frame',
      className: 'rk-text-field-frame',
      chrome: false,
      description: 'The FieldFrame of a `lg` or `multiline` box, `cols + 4` cells wide.',
    },
  ],
  variants: describeVariants(textFieldVariants, {
    size: {
      description: 'How the box is drawn.',
      values: {
        md: 'One row: the delimiters around the text, the label beside it.',
        lg: 'Three rows: a frame around the text, the label set into its top edge.',
      },
    },
  }),
  states: [
    {
      state: 'invalid',
      part: 'TextField',
      note: 'The delimiters go border.danger; a framed box goes heavy. The error row says why.',
    },
    { state: 'disabled', part: 'TextField', note: 'The text and the delimiters dim.' },
    {
      state: 'read-only',
      part: 'TextField',
      note: 'The value alone: no ground, and blank cells where the delimiters were.',
    },
    {
      state: 'focus-unframed',
      part: 'TextField',
      note: 'A `md` input takes the focus ring; a framed box goes heavy instead.',
    },
  ],
  accessibility: {
    name: "The label: beside a `md` box, or the frame's hidden label for a framed one. The delimiters, marks, frame and scrollbar are aria-hidden.",
    keyboard: [],
    typeAhead: false,
    announces:
      '"Name, edit text, Ada Lovelace". A description and an error follow, through aria-describedby.',
    notes: [
      'The keyboard is the platform’s own: nothing is intercepted.',
      'The overflow marks are decoration; a reader moves through the value with the caret as in any field.',
    ],
  },
  snapshots: [
    {
      title: 'One row',
      description:
        'Exactly `cols` cells between the delimiters. Text longer than the box puts the overflow marks where it is hidden; read-only drops the delimiters for the value alone.',
      text: [
        box({ value: 'Ada Lovelace' }),
        box({ placeholder: 'your name' }),
        box({ value: 'Ada Lovelace', readOnly: true }),
        box({ value: LONG }),
        box({ value: LONG, scroll: 8 }),
        box({ value: LONG, scroll: 15 }),
      ].join('\n'),
    },
    {
      title: 'Framed, and several rows',
      text: [
        box({ size: 'lg', label: 'Repository', required: true, value: LONG, scroll: 4 }),
        box({
          multiline: true,
          rows: 3,
          label: 'Message',
          value: 'one two three four five six seven eight nine ten eleven twelve',
          scroll: 2,
        }),
      ].join('\n'),
    },
    {
      title: 'In a form',
      text: toText(
        formBuffer(
          [
            { label: 'Name', control: textFieldBuffer({ value: 'Ada Lovelace' }), box: true },
            {
              label: 'Email',
              required: true,
              control: textFieldBuffer({ value: 'ada@' }),
              box: true,
              error: 'Enter an email address.',
            },
            { control: textFieldBuffer({ size: 'lg', label: 'Repository', value: 'rockaway' }) },
          ],
          { width: 64 },
        ),
      ),
    },
  ],
  // Drawn by its own buffer functions: the published size is measured from these (0167).
  size: {
    // Its least: no words, and a box one cell wide.
    min: toText(textFieldBuffer({ cols: 1 }), { trimEnd: false }),
    // The default variant, with words like these.
    default: box({ value: 'Ada Lovelace' }),
  },
});

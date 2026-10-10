import { Buffer, drawText, toText } from '@rockaway/grid';
import type { Glyphs } from '@rockaway/tokens';
import { type ComponentMetaInput, defineMeta } from '../metadata/schema.ts';
import { buttonBuffer } from './button.pure.ts';
import { formBuffer } from './field.pure.ts';
import type { FieldText } from './field.tsx';
import { fieldFrameBuffer } from './fieldset.pure.ts';

/** A line of text as a one-row buffer: a stand-in for a control's own buffer. */
function line(text: string): Buffer {
  return Buffer.create({ width: text.length, height: 1 }).draw((draft) => {
    drawText(draft, { x: 0, y: 0 }, text);
  });
}

/** The form's fields, in a theme's glyphs. */
function fields(glyphs: Glyphs): readonly FieldText[] {
  const [open, close] = glyphs.delimiter.control;
  /** A one-row text box, the way Text field (0035) draws one. */
  const box = (value: string): Buffer => line(`${open}${value.padEnd(20)}${close}`);
  return [
    { label: 'Name', control: box('Ada Lovelace') },
    {
      label: 'Email',
      required: true,
      control: box('ada@'),
      description: 'Where the receipts go.',
      error: 'Enter an email address.',
    },
    { label: 'Repository', control: box('rockaway') },
    { control: line(`${open}${glyphs.mark.check}${close} Sign commits`) },
    {
      control: (width) =>
        fieldFrameBuffer({ width, height: 3 }, { label: 'Notify', required: true }, glyphs).draw(
          (draft) => {
            const row = `${glyphs.mark.radio} always  ${glyphs.mark['radio-empty']} never`;
            drawText(draft, { x: 2, y: 1 }, row);
          },
        ),
    },
    { control: buttonBuffer('Save', {}, glyphs) },
  ];
}

export const formMeta: ComponentMetaInput = defineMeta({
  name: 'Form',
  summary: 'Fields in two columns of cells, labels and controls, the way a terminal form lines up.',
  description:
    "The field contract: the parts every field is built from, and the form that lines them up. A field's Label is bold on its first row, with a cell after it kept for the required mark; its Description is dim on the rows under the control; its FieldError is under that, a cross and the message in fg.danger. In a Form every field shares one label column, as wide as the longest label, so every control starts in the same cell, and under 60 cells the form stacks each label over its control. React Aria supplies the semantics: the label names the control, the description and the error describe it, and validation is native unless the form says otherwise.",
  whenToUse: [
    'To collect values a reader submits together: settings, a sign-up, a commit.',
    'To build a field component, from Label, Description and FieldError on its React Aria root.',
    "To put a server's errors on the fields they belong to, with `validationErrors`.",
  ],
  whenNotToUse: [
    {
      text: 'For a single setting that takes effect at once, with nothing to submit. The field on its own does that.',
    },
    {
      text: 'To group fields under a heading of their own inside a form.',
      instead: 'Fieldset',
    },
  ],
  related: [
    {
      name: 'Fieldset',
      why: 'A framed group whose legend is set into its top edge; its fields line up as a form’s do.',
    },
    { name: 'Button', why: 'A form’s actions sit in the control column, under the fields.' },
  ],
  anatomy: [
    {
      kind: 'import',
      name: 'Form',
      description:
        "React Aria's Form, and the grid inside it that holds the two columns. It answers to its own width, so it takes the width its container gives it.",
    },
    {
      kind: 'import',
      name: 'Label',
      description:
        "The field's name, bold, on its first row in the label column. Pass the field's `isRequired` and it draws the mark.",
    },
    {
      kind: 'import',
      name: 'Description',
      description: 'Help for the field, dim, wrapped in whole cells under the control.',
    },
    {
      kind: 'import',
      name: 'FieldError',
      description:
        'Why the field is invalid, under the description: the cross, a cell of air, the message hanging after it. Rendered only while the field is invalid.',
    },
    {
      kind: 'element',
      name: 'columns',
      className: 'rk-form-grid',
      chrome: false,
      description:
        'The label column and the control column. Every field is a subgrid of them; anything else, a row of buttons, sits in the control column.',
    },
    {
      kind: 'element',
      name: 'required-mark',
      className: 'rk-label-mark',
      chrome: true,
      description:
        'The cell after the label: `*` when the field is required, blank otherwise, so required never moves the control.',
    },
    {
      kind: 'element',
      name: 'error-mark',
      className: 'rk-field-error-mark',
      chrome: true,
      description: 'The cross before the message, with a cell of air after it.',
    },
  ],
  states: [
    {
      state: 'required',
      part: 'Label',
      note: 'The mark is in the cell the label keeps for it, in fg.danger; the control carries aria-required.',
    },
    {
      state: 'disabled',
      part: 'Label',
      note: 'The label and its mark dim with the field. The description keeps its contrast: it is still help worth reading.',
    },
  ],
  accessibility: {
    name: "Each field's Label names its control. The required mark and the error's cross are aria-hidden, so no name or description holds a glyph.",
    keyboard: [{ keys: ['enter'], action: 'Submits the form, from a text field in it.' }],
    typeAhead: false,
    announces:
      '"Email, required, edit text, Where the receipts go." On a failed submit, focus moves to the first invalid field, and its error is heard there, once, as part of its description.',
    notes: [
      'The description and the error are linked to the control by aria-describedby, by React Aria.',
      'The error is not a live region: focus carries it to the reader, and a live region as well would say it twice.',
      'Validation is native by default: errors appear on submit, and the browser’s own bubbles are suppressed.',
    ],
  },
  snapshots: [
    {
      title: 'A form of mixed fields',
      description:
        'Text boxes, a checkbox, a fieldset and a button: every control starts in the same cell, after the longest label, its mark cell and two cells of air.',
      draw: (glyphs) => toText(formBuffer(fields(glyphs), { width: 64 }, glyphs)),
    },
    {
      title: 'Under 60 cells',
      description: 'The same form, stacked: each label on the row above its control.',
      draw: (glyphs) => toText(formBuffer(fields(glyphs), { width: 40 }, glyphs)),
    },
  ],
});

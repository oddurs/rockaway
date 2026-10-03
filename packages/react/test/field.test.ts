import { Attr, Buffer, drawText, hasAttr, toText } from '@rockaway/grid';
import { glyphsFor, themeGlyphs } from '@rockaway/tokens';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { buttonBuffer } from '../src/components/button.pure.ts';
import { formBuffer } from '../src/components/field.pure.ts';
import {
  Description,
  FieldError,
  type FieldText,
  Form,
  fieldClass,
  Label,
} from '../src/components/field.tsx';
import { fieldFrameBuffer } from '../src/components/fieldset.pure.ts';
import { FieldFrame, Fieldset } from '../src/components/fieldset.tsx';

const glyphs = themeGlyphs.default;
const [open, close] = glyphs.delimiter.control;

/** A one-row text box, `cols` cells between the delimiters: what 0035 will draw. */
function textBox(cols: number, value = ''): Buffer {
  const line = `${open}${value.padEnd(cols)}${close}`;
  return Buffer.create({ width: line.length, height: 1 }).draw((d) => {
    drawText(d, { x: 0, y: 0 }, line);
  });
}

/** A checkbox row, `[✓] Label`: what 0036 will draw. */
function checkbox(label: string, checked: boolean): Buffer {
  const line = `${open}${checked ? glyphs.mark.check : glyphs.mark.blank}${close} ${label}`;
  return Buffer.create({ width: line.length, height: 1 }).draw((d) => {
    drawText(d, { x: 0, y: 0 }, line);
  });
}

/** A fieldset of radios, as wide as the column it is given. */
function radios(width: number): Buffer {
  const row = `${glyphs.mark.radio} always  ${glyphs.mark['radio-empty']} never`;
  return fieldFrameBuffer({ width, height: 3 }, { label: 'Notify', required: true }).draw((d) => {
    drawText(d, { x: 2, y: 1 }, row);
  });
}

const FIELDS: readonly FieldText[] = [
  { label: 'Name', control: textBox(20, 'Ada Lovelace') },
  {
    label: 'Email',
    required: true,
    control: textBox(20, 'ada@'),
    description: 'Where the receipts go.',
    error: 'Enter an email address.',
  },
  { label: 'Repository', control: textBox(20, 'rockaway') },
  { control: checkbox('Sign commits', true) },
  { control: radios },
  { control: buttonBuffer('Save') },
];

describe('formBuffer', () => {
  // The artefact this ticket is for: mixed fields, one column of controls.
  test('a form of mixed fields lines its controls up in one column of cells', () => {
    expect(`\n${toText(formBuffer(FIELDS, { width: 64 }))}`).toMatchInlineSnapshot(`
      "
      Name         [Ada Lovelace        ]

      Email*       [ada@                ]
                   Where the receipts go.
                   ✗ Enter an email address.

      Repository   [rockaway            ]

                   [✓] Sign commits

                   ┌ Notify* ────────────────────────────────────────┐
                   │ ● always  ○ never                               │
                   └─────────────────────────────────────────────────┘

                   [ Save ]"
    `);
  });

  test('every control starts in the same cell', () => {
    // The label column is the longest label, its mark cell, and two of air:
    // every row that holds anything has it at cell 13, and nothing between.
    const rows = toText(formBuffer(FIELDS, { width: 64 }), { trimEnd: false }).split('\n');
    for (const row of rows.filter((r) => r.trim() !== '')) {
      expect(row[13], row).not.toBe(' ');
      expect(row.slice(10, 13), row).toBe('   ');
    }
  });

  test('under 60 cells it stacks: each label on the row above its control', () => {
    expect(`\n${toText(formBuffer(FIELDS, { width: 40 }))}`).toMatchInlineSnapshot(`
      "
      Name
      [Ada Lovelace        ]

      Email*
      [ada@                ]
      Where the receipts go.
      ✗ Enter an email address.

      Repository
      [rockaway            ]

      [✓] Sign commits

      ┌ Notify* ─────────────────────────────┐
      │ ● always  ○ never                    │
      └──────────────────────────────────────┘

      [ Save ]"
    `);
    // 59 cells stacks; 60 does not.
    expect(toText(formBuffer(FIELDS, { width: 59 })).startsWith('Name\n')).toBe(true);
    expect(toText(formBuffer(FIELDS, { width: 60 })).startsWith('Name         [')).toBe(true);
  });

  test('a label column given in cells; a longer label wraps inside it', () => {
    const fields: FieldText[] = [
      { label: 'Name', control: textBox(12) },
      { label: 'Commit message', required: true, control: textBox(12) },
    ];
    expect(`\n${toText(formBuffer(fields, { width: 60, labelWidth: 11 }))}`).toMatchInlineSnapshot(`
        "
        Name       [            ]

        Commit     [            ]
        message*"
      `);
  });

  test('the description and the error wrap in whole cells, and the error hangs', () => {
    const fields: FieldText[] = [
      {
        label: 'Path',
        control: textBox(16),
        description: 'Relative to the root of the repository.',
        error: 'No such file or directory in this tree.',
      },
    ];
    expect(`\n${toText(formBuffer(fields, { width: 28 }))}`).toMatchInlineSnapshot(`
      "
      Path
      [                ]
      Relative to the root of the
      repository.
      ✗ No such file or directory
        in this tree."
    `);
  });

  test('the label is bold, the mark and the error danger, the description dim', () => {
    const buffer = formBuffer(FIELDS, { width: 64 });
    const at = (x: number, y: number) => buffer.at({ x, y })?.style;
    expect(hasAttr(at(0, 0) ?? { attrs: 0 }, Attr.bold)).toBe(true);
    expect(at(5, 2)?.fg).toBe('fg.danger');
    expect(at(13, 3)?.fg).toBe('fg.muted');
    expect(at(13, 4)?.fg).toBe('fg.danger');
  });

  test('required and invalid add no cell to the control or move it', () => {
    const plain = formBuffer([{ label: 'Email', control: textBox(20) }], { width: 64 });
    const marked = formBuffer([{ label: 'Email', required: true, control: textBox(20) }], {
      width: 64,
    });
    expect(plain.row(0).indexOf(open)).toBe(marked.row(0).indexOf(open));
    // The error is a message, which is content: it adds rows below, never cells beside.
    const invalid = formBuffer([{ label: 'Email', control: textBox(20), error: 'Required.' }], {
      width: 64,
    });
    expect(invalid.row(0)).toBe(plain.row(0));
  });

  test("the marks are the theme's", () => {
    const ascii = glyphsFor({ borderSet: 'ascii' });
    const text = toText(
      formBuffer(
        [{ label: 'Email', required: true, control: textBox(4), error: 'No.' }],
        {
          width: 64,
        },
        ascii,
      ),
    );
    expect(text).toContain('Email*');
    expect(text).toContain('X No.');
  });
});

describe('fieldFrameBuffer', () => {
  const size = { width: 24, height: 3 };
  test('the label set into the top edge, and every state', () => {
    const states = [
      ['rest', {}],
      ['required', { required: true }],
      ['invalid', { invalid: true }],
      ['focused', { focused: true }],
      ['disabled', { disabled: true }],
    ] as const;
    const drawn = states
      .map(([name, state]) => {
        const rows = toText(fieldFrameBuffer(size, { label: 'Message', ...state })).split('\n');
        return rows.map((row, i) => `${(i === 0 ? name : '').padEnd(9)}${row}`).join('\n');
      })
      .join('\n');
    expect(`\n${drawn}`).toMatchInlineSnapshot(`
      "
      rest     ┌ Message ─────────────┐
               │                      │
               └──────────────────────┘
      required ┌ Message* ────────────┐
               │                      │
               └──────────────────────┘
      invalid  ┏ Message ━━━━━━━━━━━━━┓
               ┃                      ┃
               ┗━━━━━━━━━━━━━━━━━━━━━━┛
      focused  ┏ Message ━━━━━━━━━━━━━┓
               ┃                      ┃
               ┗━━━━━━━━━━━━━━━━━━━━━━┛
      disabled ┌ Message ─────────────┐
               │                      │
               └──────────────────────┘"
    `);
  });

  test('no state changes the size', () => {
    for (const state of [{}, { required: true }, { invalid: true }, { disabled: true }]) {
      const buffer = fieldFrameBuffer(size, { label: 'Message', ...state });
      expect([buffer.width, buffer.height]).toEqual([24, 3]);
    }
  });

  test('the words and the mark are bold, or dim when disabled', () => {
    const rest = fieldFrameBuffer(size, { label: 'Name', required: true });
    expect(rest.at({ x: 2, y: 0 })?.style).toEqual({ fg: 'fg.default', attrs: Attr.bold });
    // The mark is part of the label in the edge, which has one style.
    expect(rest.at({ x: 6, y: 0 })?.style).toEqual({ fg: 'fg.default', attrs: Attr.bold });
    // The line is not coloured by the buffer: the stylesheet does that from the state.
    expect(rest.at({ x: 10, y: 0 })?.style.fg).toBeUndefined();
    const disabled = fieldFrameBuffer(size, { label: 'Name', disabled: true });
    expect(disabled.at({ x: 2, y: 0 })?.style).toEqual({ fg: 'fg.disabled', attrs: Attr.dim });
  });

  test('a label too long for its edge truncates, and the mark survives', () => {
    const text = toText(
      fieldFrameBuffer({ width: 16, height: 3 }, { label: 'A very long label', required: true }),
    );
    expect(text.split('\n')[0]).toMatchInlineSnapshot(`"┌ A very l…* ──┐"`);
  });

  test('under ASCII there is no heavier line, so invalid keeps the set', () => {
    const ascii = glyphsFor({ borderSet: 'ascii' });
    expect(
      toText(fieldFrameBuffer({ width: 12, height: 3 }, { label: 'Tag', invalid: true }, ascii)),
    ).toMatchInlineSnapshot(`
        "+ Tag -----+
        |          |
        +----------+"
      `);
  });
});

/** Rendered on a server: the markup a reader's tools are handed. */
describe('the parts, as markup', () => {
  test('the required mark is aria-hidden, and the label keeps its cell when not required', () => {
    const required = renderToStaticMarkup(createElement(Label, { isRequired: true }, 'Email'));
    expect(required).toBe(
      '<label class="rk-label">Email<span aria-hidden="true" class="rk-label-mark">*</span></label>',
    );
    const plain = renderToStaticMarkup(createElement(Label, null, 'Name'));
    expect(plain).toContain('<span aria-hidden="true" class="rk-label-mark"> </span>');
  });

  test('fieldClass composes the field class with a component’s own', () => {
    expect(fieldClass('rk-text-field', undefined, 'mine')).toBe('rk-field rk-text-field mine');
  });

  test('a description is a description slot, and an error renders only when invalid', () => {
    const html = renderToStaticMarkup(
      createElement(Form, null, createElement(Description, null, 'Help.')),
    );
    expect(html).toContain('class="rk-form"');
    expect(html).toContain('<div class="rk-form-grid">');
    expect(html).toContain('class="rk-description"');
    expect(renderToStaticMarkup(createElement(FieldError, null, 'Wrong.'))).toBe('');
  });

  test('a form given a label width sets its column in cells', () => {
    const html = renderToStaticMarkup(createElement(Form, { labelWidth: 12 }));
    expect(html).toContain('--rk-form-label:calc(12 * var(--rk-cell-width))');
  });

  test('a fieldset on its own is a group named by its legend, and its chrome is hidden', () => {
    const html = renderToStaticMarkup(createElement(Fieldset, { legend: 'Notify' }, 'body'));
    const group = /role="group"[^>]*aria-labelledby="([^"]+)"/.exec(html);
    expect(group).not.toBeNull();
    const id = group?.[1] ?? '';
    expect(html).toContain(`id="${id}"`);
    // The label is the legend, and only the legend.
    expect(new RegExp(`<label[^>]*id="${id}"[^>]*>Notify</label>`).test(html)).toBe(true);
  });

  test('a field frame is no group of its own, and says which kind it is', () => {
    const html = renderToStaticMarkup(createElement(FieldFrame, { label: 'Message' }));
    expect(html).toContain('role="presentation"');
    expect(html).toContain('data-kind="control"');
    expect(html).not.toContain('role="group"');
  });
});

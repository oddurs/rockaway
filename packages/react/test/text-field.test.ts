import { Attr, hasAttr, toText } from '@rockaway/grid';
import { glyphsFor } from '@rockaway/tokens';
import { describe, expect, test } from 'vitest';
import { formBuffer } from '../src/components/field.tsx';
import { fieldFrameBuffer } from '../src/components/fieldset.tsx';
import { type TextFieldTextOptions, textFieldBuffer } from '../src/components/text-field.tsx';

const box = (options: TextFieldTextOptions): string =>
  toText(textFieldBuffer({ cols: 16, ...options }), { trimEnd: false });

describe('textFieldBuffer', () => {
  test('one row: the delimiters around exactly cols cells', () => {
    const rows = [
      ['empty', box({})],
      ['value', box({ value: 'Ada Lovelace' })],
      ['placeholder', box({ placeholder: 'your name' })],
      ['read-only', box({ value: 'Ada Lovelace', readOnly: true })],
      ['long, at start', box({ value: 'a value far longer than its box' })],
      ['long, scrolled', box({ value: 'a value far longer than its box', scroll: 8 })],
      ['long, at end', box({ value: 'a value far longer than its box', scroll: 15 })],
    ];
    expect(
      `\n${rows.map(([name, text]) => `${name?.padEnd(15)}${text}|`).join('\n')}`,
    ).toMatchInlineSnapshot(`
        "
        empty          [                ]|
        value          [Ada Lovelace    ]|
        placeholder    [your name       ]|
        read-only       Ada Lovelace     |
        long, at start [a value far long›|
        long, scrolled ‹far longer than ›|
        long, at end   ‹ger than its box]|"
      `);
  });

  test('framed: the label in the top edge, a cell of air either side of the text', () => {
    expect(
      `\n${box({ size: 'lg', label: 'Name', value: 'Ada Lovelace' })}\n${box({
        size: 'lg',
        label: 'Repository',
        required: true,
        value: 'a value far longer than its box',
        scroll: 4,
      })}`,
    ).toMatchInlineSnapshot(`
      "
      ┌ Name ────────────┐
      │ Ada Lovelace     │
      └──────────────────┘
      ┌ Repository* ─────┐
      │‹lue far longer t›│
      └──────────────────┘"
    `);
  });

  test('several rows: framed, scrolled by whole rows, with a scrollbar column', () => {
    const text = 'one two three four five six seven eight nine ten eleven twelve';
    expect(
      `\n${box({ multiline: true, rows: 3, label: 'Message', value: text })}\n${box({
        multiline: true,
        rows: 3,
        label: 'Message',
        value: text,
        scroll: 2,
      })}`,
    ).toMatchInlineSnapshot(`
      "
      ┌ Message ─────────┐
      │ one two three   █│
      │ four five six   █│
      │ seven eight nine░│
      └──────────────────┘
      ┌ Message ─────────┐
      │ seven eight nine░│
      │ ten eleven      █│
      │ twelve          █│
      └──────────────────┘"
    `);
  });

  test('no state changes the box: same cells across, same rows down', () => {
    const states: TextFieldTextOptions[] = [
      {},
      { value: 'x' },
      { placeholder: 'y' },
      { readOnly: true },
      { disabled: true },
      { invalid: true },
      { required: true },
      { focused: true },
    ];
    for (const shape of [{}, { size: 'lg' as const }, { multiline: true, rows: 4 }]) {
      const sizes = states.map((state) => {
        const b = textFieldBuffer({ cols: 12, label: 'Name', ...shape, ...state });
        return `${b.width}x${b.height}`;
      });
      expect(new Set(sizes).size).toBe(1);
    }
    expect(textFieldBuffer({ cols: 12 }).width).toBe(14);
    expect(textFieldBuffer({ cols: 12, size: 'lg' }).width).toBe(16);
    expect(textFieldBuffer({ cols: 12, size: 'lg' }).height).toBe(3);
    expect(textFieldBuffer({ cols: 12, multiline: true, rows: 4 }).height).toBe(6);
  });

  test('placeholder and disabled text are dim; a value is not', () => {
    const at = (options: TextFieldTextOptions) =>
      textFieldBuffer({ cols: 8, ...options }).at({ x: 1, y: 0 })?.style ?? { attrs: 0 };
    expect(hasAttr(at({ placeholder: 'name' }), Attr.dim)).toBe(true);
    expect(hasAttr(at({ value: 'name', disabled: true }), Attr.dim)).toBe(true);
    expect(hasAttr(at({ value: 'name' }), Attr.dim)).toBe(false);
  });

  test("the marks are the theme's", () => {
    const ascii = glyphsFor({ borderSet: 'ascii' });
    expect(
      toText(textFieldBuffer({ cols: 6, value: 'abcdefghij', scroll: 2 }, ascii)),
    ).toMatchInlineSnapshot(`"<cdefgh>"`);
  });
});

describe('a heavy frame under ASCII (0183)', () => {
  test('keeps its letters and goes bold', () => {
    const ascii = glyphsFor({ borderSet: 'ascii' });
    const rest = fieldFrameBuffer({ width: 12, height: 3 }, { label: 'Tag' }, ascii);
    const invalid = fieldFrameBuffer(
      { width: 12, height: 3 },
      { label: 'Tag', invalid: true },
      ascii,
    );
    expect(toText(invalid)).toBe(toText(rest));
    const corner = (b: typeof rest) => b.at({ x: 0, y: 0 })?.style ?? { attrs: 0 };
    expect(hasAttr(corner(rest), Attr.bold)).toBe(false);
    expect(hasAttr(corner(invalid), Attr.bold)).toBe(true);
    expect(hasAttr(invalid.at({ x: 0, y: 1 })?.style ?? { attrs: 0 }, Attr.bold)).toBe(true);
  });
});

describe('in a form', () => {
  test('a md box beside its label, framed ones in the control column', () => {
    const fields = [
      { label: 'Name', control: textFieldBuffer({ value: 'Ada Lovelace' }) },
      {
        label: 'Email',
        required: true,
        control: textFieldBuffer({ value: 'ada@' }),
        error: 'Enter an email address.',
      },
      { control: textFieldBuffer({ size: 'lg', label: 'Repository', value: 'rockaway' }) },
      {
        control: textFieldBuffer({
          multiline: true,
          rows: 2,
          label: 'Message',
          placeholder: 'Why this change',
        }),
        description: 'The first line is the summary.',
      },
    ];
    expect(`\n${toText(formBuffer(fields, { width: 64 }))}`).toMatchInlineSnapshot(`
      "
      Name    [Ada Lovelace        ]

      Email*  [ada@                ]
              ✗ Enter an email address.

              ┌ Repository ──────────┐
              │ rockaway             │
              └──────────────────────┘

              ┌ Message ─────────────┐
              │ Why this change     █│
              │                     █│
              └──────────────────────┘
              The first line is the summary."
    `);
  });
});

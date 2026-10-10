import { Attr, toText } from '@rockaway/grid';
import { glyphsFor } from '@rockaway/tokens';
import { describe, expect, test } from 'vitest';
import { selectBuffer, selectTriggerBuffer } from '../src/components/select.pure.ts';
import type { SelectText } from '../src/components/select.tsx';

const THEMES: SelectText['options'] = [
  { label: 'default' },
  { label: 'ink' },
  { label: 'phosphor' },
  { label: 'ice', disabled: true },
  { label: 'tokyo-night' },
];

const draw = (select: Partial<SelectText> = {}): string =>
  toText(selectBuffer({ cols: 16, options: THEMES, placeholder: 'Choose one', ...select }));

describe('selectTriggerBuffer', () => {
  test('exactly cols wide, the value cut to its room and never touching the mark', () => {
    expect(
      [
        toText(selectTriggerBuffer('phosphor', 16), { trimEnd: false }),
        toText(selectTriggerBuffer('a-theme-named-at-length', 16), { trimEnd: false }),
        toText(selectTriggerBuffer('x', 6), { trimEnd: false }),
      ].join('|\n'),
    ).toMatchInlineSnapshot(`
      "[ phosphor    ▾]|
      [ a-theme-na… ▾]|
      [ x ▾]"
    `);
    for (const value of ['', 'phosphor', 'a-theme-named-at-length']) {
      expect(selectTriggerBuffer(value, 16).width).toBe(16);
    }
  });

  test('states: placeholder muted, invalid in danger, pressed reversed, disabled dim', () => {
    const at = (state: Parameters<typeof selectTriggerBuffer>[2]) => {
      const buffer = selectTriggerBuffer('ink', 16, state);
      const ends = buffer.at({ x: 0, y: 0 })?.style;
      const value = buffer.at({ x: 2, y: 0 })?.style;
      return `${ends?.fg} | ${value?.fg} ${(value?.attrs ?? 0) & Attr.reverse ? 'reverse' : ''}`.trim();
    };
    expect(
      [
        at({}),
        at({ placeholder: true }),
        at({ invalid: true }),
        at({ pressed: true }),
        at({ disabled: true }),
      ].join('\n'),
    ).toMatchInlineSnapshot(`
      "border.control | fg.default
      border.control | fg.muted
      border.danger | fg.default
      border.control | fg.default reverse
      fg.disabled | fg.disabled"
    `);
  });
});

describe('selectBuffer', () => {
  test('closed, with a value and without', () => {
    expect([draw({ value: 'phosphor' }), draw()].join('\n')).toMatchInlineSnapshot(`
      "[ phosphor    ▾]
      [ Choose one  ▾]"
    `);
  });

  test('open: the popover under the trigger, its rows starting in the value column', () => {
    expect(draw({ value: 'phosphor', open: true, cursor: 'ink' })).toMatchInlineSnapshot(`
      "[ phosphor    ▾]
      ┏━━━━━━━━━━━━━━━┓
      ┃   default     ┃
      ┃ ▸ ink         ┃
      ┃  ✓phosphor    ┃
      ┃   ice         ┃
      ┃   tokyo-night ┃
      ┗━━━━━━━━━━━━━━━┛"
    `);
    const lines = draw({ value: 'phosphor', open: true, cursor: 'ink' }).split('\n');
    // The value starts in the trigger's third cell, and every row's marks in that column too.
    expect(lines[0]?.indexOf('phosphor')).toBe(2);
    expect(lines[3]?.indexOf('▸')).toBe(2);
    expect(lines[4]?.indexOf('✓')).toBe(3);
  });

  test('at least as wide as its trigger, and wider when a label needs it', () => {
    expect(selectBuffer({ cols: 30, options: THEMES, open: true }).width).toBe(30);
    // The frame and its air either side, the two mark cells, and 'tokyo-night'.
    expect(selectBuffer({ cols: 8, options: THEMES, open: true }).width).toBe(2 + 2 + 2 + 11);
  });

  test('in ASCII', () => {
    expect(
      toText(
        selectBuffer(
          { cols: 16, options: THEMES, value: 'ink', open: true, cursor: 'ink' },
          glyphsFor({ borderSet: 'ascii' }),
        ),
      ),
    ).toMatchInlineSnapshot(`
      "[ ink         v]
      +---------------+
      |   default     |
      | >xink         |
      |   phosphor    |
      |   ice         |
      |   tokyo-night |
      +---------------+"
    `);
  });
});

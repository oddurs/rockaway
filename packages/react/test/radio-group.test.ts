import { Attr, toText } from '@rockaway/grid';
import { glyphsFor } from '@rockaway/tokens';
import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import {
  Radio,
  RadioGroup,
  type RadioGroupText,
  type RadioState,
  type RadioText,
  radioBuffer,
  radioGroupBuffer,
  radioMarkStyle,
} from '../src/components/radio-group.tsx';

const text = (state: RadioState = {}, label = 'main'): string =>
  toText(radioBuffer(label, state), { trimEnd: false });

/** The mark cell's colour and attributes, as words. */
const drawn = (state: RadioState): string => {
  const { fg, attrs } = radioMarkStyle(state);
  const names = (
    [
      [Attr.reverse, 'reverse'],
      [Attr.dim, 'dim'],
    ] as const
  ).flatMap(([bit, name]) => ((attrs & bit) !== 0 ? [name] : []));
  return [fg, ...names].join(' ');
};

const STATES: readonly (readonly [string, RadioState])[] = [
  ['empty', {}],
  ['chosen', { selected: true }],
  ['hovered', { hovered: true }],
  ['pressed', { pressed: true }],
  ['chosen, pressed', { selected: true, pressed: true }],
  ['disabled', { disabled: true }],
  ['chosen, disabled', { selected: true, disabled: true }],
  ['invalid', { invalid: true }],
  ['chosen, invalid', { selected: true, invalid: true }],
  ['read-only', { readOnly: true }],
  ['chosen, read-only', { selected: true, readOnly: true }],
];

const BRANCHES: readonly RadioText[] = [
  { label: 'main', selected: true },
  { label: 'develop' },
  { label: 'release' },
];

const group = (options: Partial<RadioGroupText> = {}): string =>
  toText(radioGroupBuffer({ label: 'Branch', options: BRANCHES, width: 34, ...options }));

/** What the component renders, as text: every element's text in order, chrome included. */
function rendered(element: ReactElement): string {
  return renderToStaticMarkup(element).replace(/<[^>]+>/g, '');
}

describe('radioBuffer', () => {
  test('every state, as cells, with the mark’s colour and attributes', () => {
    const rows = STATES.map(
      ([name, state]) => `${name.padEnd(18)}|${text(state)}|  ${drawn(state)}`,
    );
    expect(rows.join('\n')).toMatchInlineSnapshot(`
      "empty             |○ main|  fg.default
      chosen            |● main|  fg.accent
      hovered           |○ main|  fg.default
      pressed           |○ main|  fg.default reverse
      chosen, pressed   |● main|  fg.accent reverse
      disabled          |○ main|  fg.disabled dim
      chosen, disabled  |● main|  fg.disabled dim
      invalid           |○ main|  fg.danger
      chosen, invalid   |● main|  fg.danger
      read-only         |  main|  fg.default
      chosen, read-only |● main|  fg.accent"
    `);
  });

  test('no state changes the width: the mark has its cell in every one', () => {
    expect(new Set(STATES.map(([, state]) => text(state).length))).toEqual(new Set([6]));
  });

  test('the marks are the theme’s', () => {
    const ascii = glyphsFor({ borderSet: 'ascii' });
    expect(
      [
        toText(radioBuffer('main', { selected: true }, ascii)),
        toText(radioBuffer('dev', {}, ascii)),
      ].join('\n'),
    ).toMatchInlineSnapshot(`
      "* main
      o dev"
    `);
  });

  test('draws exactly the cells the component renders', () => {
    const one = (props: Record<string, unknown>) =>
      rendered(
        createElement(
          RadioGroup,
          { label: 'Branch', ...props },
          createElement(Radio, { value: 'main' }, 'main'),
        ),
      );
    // The frame's chrome comes first, painted on the server (0126); then the
    // legend, the hidden label's text; then the radio.
    expect(one({})).toMatch(new RegExp(`Branch${text({})}$`));
    expect(one({ defaultValue: 'main' })).toMatch(new RegExp(`Branch${text({ selected: true })}$`));
    expect(one({ isReadOnly: true })).toMatch(new RegExp(`Branch${text({ readOnly: true })}$`));
  });

  test('the mark is chrome, and the radio is a radio named by its words', () => {
    const html = renderToStaticMarkup(
      createElement(
        RadioGroup,
        { label: 'Branch' },
        createElement(Radio, { value: 'main' }, 'main'),
      ),
    );
    expect(html).toMatch(/<span aria-hidden="true" class="rk-radio-indicator">/);
    expect(html).toMatch(/role="radiogroup"/);
    expect(html).toMatch(/type="radio"/);
    expect(html).toMatch(/class="rk-field rk-radio-group"/);
    expect(html).toMatch(/class="rk-radio-options" data-orientation="vertical"/);
  });
});

describe('radioGroupBuffer', () => {
  test('vertical, horizontal, and horizontal wrapping whole radios', () => {
    expect(
      [
        group(),
        group({ orientation: 'horizontal' }),
        group({ orientation: 'horizontal', width: 20 }),
      ].join('\n'),
    ).toMatchInlineSnapshot(`
      "┌ Branch ────────────────────────┐
      │ ● main                         │
      │ ○ develop                      │
      │ ○ release                      │
      └────────────────────────────────┘
      ┌ Branch ────────────────────────┐
      │ ● main  ○ develop  ○ release   │
      └────────────────────────────────┘
      ┌ Branch ──────────┐
      │ ● main           │
      │ ○ develop        │
      │ ○ release        │
      └──────────────────┘"
    `);
  });

  test('required, invalid, disabled and read-only', () => {
    expect(
      [
        group({ orientation: 'horizontal', required: true }),
        group({ orientation: 'horizontal', invalid: true }),
        group({ orientation: 'horizontal', disabled: true }),
        group({ orientation: 'horizontal', readOnly: true }),
      ].join('\n'),
    ).toMatchInlineSnapshot(`
      "┌ Branch* ───────────────────────┐
      │ ● main  ○ develop  ○ release   │
      └────────────────────────────────┘
      ┏ Branch ━━━━━━━━━━━━━━━━━━━━━━━━┓
      ┃ ● main  ○ develop  ○ release   ┃
      ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
      ┌ Branch ────────────────────────┐
      │ ● main  ○ develop  ○ release   │
      └────────────────────────────────┘
      ┌ Branch ────────────────────────┐
      │ ● main    develop    release   │
      └────────────────────────────────┘"
    `);
  });

  test('a disabled or invalid group draws every mark that way', () => {
    const buffer = radioGroupBuffer({
      label: 'Branch',
      options: BRANCHES,
      width: 30,
      invalid: true,
    });
    expect(buffer.at({ x: 2, y: 2 })?.style.fg).toBe('fg.danger');
  });
});

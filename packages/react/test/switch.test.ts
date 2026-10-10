import { Attr, toText } from '@rockaway/grid';
import { glyphsFor } from '@rockaway/tokens';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import {
  Switch,
  type SwitchState,
  switchBuffer,
  switchTrack,
  switchTrackStyle,
} from '../src/components/switch.tsx';

const text = (state: SwitchState = {}, label = 'Wrap lines'): string =>
  toText(switchBuffer(label, state), { trimEnd: false });

/** The attributes on the track's cells, as words. */
const attrs = (state: SwitchState): string => {
  const { attrs: bits } = switchTrackStyle(state);
  const names = (
    [
      [Attr.reverse, 'reverse'],
      [Attr.dim, 'dim'],
    ] as const
  ).flatMap(([bit, name]) => ((bits & bit) !== 0 ? [name] : []));
  return names.length === 0 ? '-' : names.join(' ');
};

/** What the component renders, as text: every element's text in order, chrome included. */
function rendered(props: Parameters<typeof Switch>[0]): string {
  const html = renderToStaticMarkup(createElement(Switch, props));
  return html.replace(/<[^>]+>/g, '');
}

const STATES: readonly (readonly [string, SwitchState])[] = [
  ['off', {}],
  ['on', { selected: true }],
  ['off, pressed', { pressed: true }],
  ['on, pressed', { selected: true, pressed: true }],
  ['off, hovered', { hovered: true }],
  ['off, disabled', { disabled: true }],
  ['on, disabled', { selected: true, disabled: true }],
  ['off, read-only', { readOnly: true }],
  ['on, read-only', { selected: true, readOnly: true }],
];

describe('switchBuffer', () => {
  test('every state, as cells, with the track’s attributes', () => {
    const rows = STATES.map(
      ([name, state]) => `${name.padEnd(15)}|${text(state)}|  ${attrs(state)}`,
    );
    expect(rows.join('\n')).toMatchInlineSnapshot(`
      "off            |[●──] Wrap lines|  -
      on             |[──●] Wrap lines|  reverse
      off, pressed   |[●──] Wrap lines|  reverse
      on, pressed    |[──●] Wrap lines|  -
      off, hovered   |[●──] Wrap lines|  -
      off, disabled  |[●──] Wrap lines|  dim
      on, disabled   |[──●] Wrap lines|  reverse dim
      off, read-only |[●  ] Wrap lines|  -
      on, read-only  |[  ●] Wrap lines|  -"
    `);
  });

  test('on and off differ in the thumb’s place and in reverse video', () => {
    expect(text({ selected: true })).not.toBe(text({}));
    expect(switchTrackStyle({ selected: true }).attrs & Attr.reverse).toBe(Attr.reverse);
    expect(switchTrackStyle({}).attrs & Attr.reverse).toBe(0);
  });

  test('no state changes the width: the switch is the same cells in every one', () => {
    const widths = new Set(STATES.map(([, state]) => text(state).length));
    expect(widths).toEqual(new Set(['[●──] Wrap lines'.length]));
  });

  test('hover underlines the label, and only the label', () => {
    const buffer = switchBuffer('Wrap lines', { hovered: true });
    const underlined = [...Array(buffer.width).keys()].filter(
      (x) => ((buffer.at({ x, y: 0 })?.style.attrs ?? 0) & Attr.underline) !== 0,
    );
    expect(underlined).toEqual([...Array('Wrap lines'.length).keys()].map((i) => i + 6));
  });

  test('the glyphs are the theme’s', () => {
    const ascii = glyphsFor({ borderSet: 'ascii' });
    expect(
      [
        toText(switchBuffer('Wrap lines', {}, ascii)),
        toText(switchBuffer('Wrap lines', { selected: true }, ascii)),
      ].join('\n'),
    ).toMatchInlineSnapshot(`
      "[O--] Wrap lines
      [--O] Wrap lines"
    `);
    expect(switchTrack({ selected: true, readOnly: true }, ascii)).toBe('  O');
  });

  test('draws exactly the cells the component renders', () => {
    const cases: readonly (readonly [Parameters<typeof Switch>[0], SwitchState])[] = [
      [{ children: 'Wrap lines' }, {}],
      [{ children: 'Wrap lines', defaultSelected: true }, { selected: true }],
      [{ children: 'Wrap lines', isReadOnly: true }, { readOnly: true }],
      [
        { children: 'Wrap lines', isSelected: true, isReadOnly: true },
        { selected: true, readOnly: true },
      ],
    ];
    for (const [props, state] of cases) {
      expect(rendered(props), JSON.stringify(state)).toBe(text(state));
    }
  });

  test('the track is painted cells: the line is a shape the cell strokes, the thumb a letter', () => {
    const html = renderToStaticMarkup(createElement(Switch, null, 'Wrap lines'));
    expect(html).toMatch(/data-rk-painted="glyph"/);
    expect(html).toMatch(
      /<span class="rk-run" style="--rk-col:1;--rk-run:2" data-rk-shape="[^"]+">──<\/span>/,
    );
    const rule = renderToStaticMarkup(createElement(Switch, { painter: 'rule' }, 'x'));
    expect(rule).toMatch(/data-rk-painted="rule"/);
  });

  test('the chrome is hidden, and the switch is a switch named by its label', () => {
    const html = renderToStaticMarkup(createElement(Switch, null, 'Wrap lines'));
    expect(html).toMatch(/<span aria-hidden="true" class="rk-switch-indicator">/);
    expect(html).toMatch(/role="switch"/);
    expect(html).toMatch(/class="rk-field rk-switch"/);
  });
});

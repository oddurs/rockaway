import { Attr, type Buffer, hasAttr, toText } from '@rockaway/grid';
import { glyphsFor } from '@rockaway/tokens';
import { describe, expect, test } from 'vitest';
import { linkBuffer } from '../src/components/link.pure.ts';
import type { LinkState } from '../src/components/link.tsx';

const STATES: ReadonlyArray<readonly [string, LinkState]> = [
  ['rest', {}],
  ['hovered', { hovered: true }],
  ['focus-visible', { focusVisible: true }],
  ['pressed', { pressed: true }],
  ['current', { current: true }],
  ['current, pressed', { current: true, pressed: true }],
  ['disabled', { disabled: true }],
  ['new tab', { newTab: true }],
  ['new tab, pressed', { newTab: true, pressed: true }],
];

const NAMES: ReadonlyArray<readonly [number, string]> = [
  [Attr.bold, 'bold'],
  [Attr.dim, 'dim'],
  [Attr.reverse, 'reverse'],
  [Attr.underline, 'underline'],
];

/** Each run of cells that share a style, as `cells: attributes fg`. */
function runs(buffer: Buffer): string {
  const out: string[] = [];
  let start = 0;
  let key = '';
  const flush = (end: number): void => {
    const cells = end - 1 === start ? `${start}` : `${start}-${end - 1}`;
    if (key !== '') out.push(`${cells} ${key}`);
  };
  for (let x = 0; x <= buffer.width; x++) {
    const cell = x < buffer.width ? buffer.at({ x, y: 0 }) : undefined;
    const attrs = cell ? NAMES.filter(([bit]) => hasAttr(cell.style, bit)).map(([, n]) => n) : [];
    const next = cell?.style.fg ? `${[...attrs, cell.style.fg].join(' ')}` : '';
    if (next !== key || x === buffer.width) {
      flush(x);
      start = x;
      key = next;
    }
  }
  return out.join(', ');
}

describe('linkBuffer', () => {
  // Hover is bold, which the snapshot shows; focus is an outline drawn
  // around the cells, which is no cell attribute, so it prints as rest. Neither
  // costs a cell or changes one.
  test('every state, cell by cell: the first cell is the one before the link', () => {
    const rows = STATES.map(([name, state]) => {
      const cells = toText(linkBuffer('docs', state), { trimEnd: false }).padEnd(6);
      return `${name.padEnd(17)}│${cells}│  ${runs(linkBuffer('docs', state))}`;
    });
    expect(rows.join('\n')).toMatchInlineSnapshot(`
      "rest             │ docs │  1-4 underline fg.accent
      hovered          │ docs │  1-4 bold underline fg.accent
      focus-visible    │ docs │  1-4 underline fg.accent
      pressed          │ docs │  1-4 reverse underline fg.accent
      current          │▸docs │  0 bold fg.default, 1-4 bold underline fg.default
      current, pressed │▸docs │  0 bold fg.default, 1-4 bold reverse underline fg.default
      disabled         │ docs │  1-4 dim underline fg.disabled
      new tab          │ docs↗│  1-4 underline fg.accent, 5 fg.accent
      new tab, pressed │ docs↗│  1-4 reverse underline fg.accent, 5 reverse fg.accent"
    `);
  });

  test('no state changes the width: only the external mark adds a cell, and it is not a state', () => {
    const inPlace = STATES.filter(([, state]) => !state.newTab).map(
      ([, state]) => linkBuffer('read the guide', state).width,
    );
    expect(new Set(inPlace)).toEqual(new Set([15]));
    const newTab = STATES.filter(([, state]) => state.newTab).map(
      ([, state]) => linkBuffer('read the guide', state).width,
    );
    expect(new Set(newTab)).toEqual(new Set([16]));
  });

  test('every state is underlined, so a link never relies on its colour', () => {
    for (const [, state] of STATES) {
      const label = linkBuffer('docs', state).at({ x: 1, y: 0 });
      expect(label && hasAttr(label.style, Attr.underline)).toBe(true);
    }
  });

  test("the marks are not underlined, and are the theme's", () => {
    const ascii = glyphsFor({ borderSet: 'ascii' });
    const buffer = linkBuffer('docs', { current: true, newTab: true }, ascii);
    expect(toText(buffer)).toMatchInlineSnapshot(`">docs^"`);
    for (const x of [0, buffer.width - 1]) {
      const cell = buffer.at({ x, y: 0 });
      expect(cell && hasAttr(cell.style, Attr.underline)).toBe(false);
    }
  });

  test('a wide label is measured in cells, not characters', () => {
    expect(linkBuffer('文档', {}).width).toBe(5);
  });
});

import { Attr, hasAttr, stringWidth, toText } from '@rockaway/grid';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { skipLinkBuffer } from '../src/components/skip-link.pure.ts';
import { SkipLink } from '../src/components/skip-link.tsx';

describe('skipLinkBuffer', () => {
  test('the label with a cell of air either side, one row', () => {
    const buffer = skipLinkBuffer('Skip to content');
    expect(buffer.height).toBe(1);
    expect(buffer.width).toBe(stringWidth('Skip to content') + 2);
    expect(toText(buffer, { trimEnd: false })).toBe(' Skip to content ');
  });

  test('every cell is reversed, and only the words are underlined', () => {
    const buffer = skipLinkBuffer('go');
    const cells = [0, 1, 2, 3].map((x) => buffer.at({ x, y: 0 })?.style);
    for (const style of cells) {
      expect(style && hasAttr(style, Attr.reverse)).toBe(true);
      expect(style?.fg).toBe('fg.default');
    }
    const underlined = cells.map((style) => (style ? hasAttr(style, Attr.underline) : false));
    expect(underlined).toEqual([false, true, true, false]);
  });

  test('wide characters take their two cells', () => {
    expect(skipLinkBuffer('跳').width).toBe(4);
  });
});

describe('SkipLink', () => {
  test('an anchor to the target, in the system class, with words by default', () => {
    const html = renderToStaticMarkup(createElement(SkipLink, { target: 'main' }));
    expect(html).toBe(
      '<a href="#main" class="rk-skip-link" data-rk-control="">Skip to content</a>',
    );
  });

  test('its own words, and a class of the caller beside the system one', () => {
    const html = renderToStaticMarkup(
      createElement(SkipLink, { target: 'content', className: 'page-skip' }, 'Skip to the page'),
    );
    expect(html).toBe(
      '<a href="#content" class="rk-skip-link page-skip" data-rk-control="">Skip to the page</a>',
    );
  });
});

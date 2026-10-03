import { Attr, hasAttr, toText } from '@rockaway/grid';
import { glyphsFor } from '@rockaway/tokens';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { backdropBuffer, overlayBuffer } from '../src/components/overlay.pure.ts';
import { OverlayLayer } from '../src/components/overlay.tsx';

describe('overlayBuffer', () => {
  test('a popover is framed heavy, a modal double: heavier than the page, never a shadow', () => {
    const size = { width: 14, height: 3 };
    expect(
      `\n${toText(overlayBuffer(size, { kind: 'popover' }))}\n${toText(overlayBuffer(size, { kind: 'modal' }))}`,
    ).toMatchInlineSnapshot(`
      "
      ┏━━━━━━━━━━━━┓
      ┃            ┃
      ┗━━━━━━━━━━━━┛
      ╔════════════╗
      ║            ║
      ╚════════════╝"
    `);
  });

  test('content that scrolls puts the thumb in the right edge, in whole cells', () => {
    const size = { width: 8, height: 6 };
    const at = (offset: number) =>
      toText(overlayBuffer(size, { scroll: { total: 12, visible: 4, offset } }))
        .split('\n')
        .map((row) => row.at(-1))
        .join('');
    expect([at(0), at(4), at(8)]).toMatchInlineSnapshot(`
      [
        "┓█┃┃┃┛",
        "┓┃┃█┃┛",
        "┓┃┃┃█┛",
      ]
    `);
    // Nothing to scroll: the edge is a plain line.
    expect(toText(overlayBuffer(size, { scroll: { total: 4, visible: 4, offset: 0 } }))).toBe(
      toText(overlayBuffer(size)),
    );
  });

  test('under ASCII the frame is ASCII, and bold for its weight (0183)', () => {
    const ascii = glyphsFor({ borderSet: 'ascii' });
    const buffer = overlayBuffer({ width: 6, height: 3 }, { kind: 'modal' }, ascii);
    expect(toText(buffer)).toMatchInlineSnapshot(`
      "+----+
      |    |
      +----+"
    `);
    expect(hasAttr(buffer.at({ x: 0, y: 0 })?.style ?? { attrs: 0 }, Attr.bold)).toBe(true);
  });
});

describe('backdropBuffer', () => {
  test("every cell the theme's light shade, in fg.muted on the page's ground", () => {
    const buffer = backdropBuffer({ width: 6, height: 2 });
    expect(toText(buffer)).toMatchInlineSnapshot(`
      "░░░░░░
      ░░░░░░"
    `);
    expect(buffer.at({ x: 3, y: 1 })?.style).toEqual({
      fg: 'fg.muted',
      bg: 'bg.page',
      attrs: Attr.none,
    });
    expect(toText(backdropBuffer({ width: 4, height: 1 }, glyphsFor({ borderSet: 'ascii' })))).toBe(
      '....',
    );
  });
});

describe('the layer', () => {
  test('renders its children and the portal root after them', () => {
    const html = renderToStaticMarkup(createElement(OverlayLayer, null, createElement('main')));
    expect(html).toBe('<main></main><div class="rk-overlay-layer"></div>');
  });
});

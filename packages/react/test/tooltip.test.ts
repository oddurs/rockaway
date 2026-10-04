import { Attr, hasAttr, toText } from '@rockaway/grid';
import { describe, expect, test } from 'vitest';
import { TOOLTIP_MAX_COLS, tooltipBuffer } from '../src/components/tooltip.pure.ts';

describe('tooltipBuffer', () => {
  test('one row is reverse video across it, with no frame', () => {
    const buffer = tooltipBuffer({ width: 8, height: 1 });
    expect(toText(buffer, { trimEnd: false })).toBe('        ');
    for (let x = 0; x < 8; x++) {
      expect(hasAttr(buffer.at({ x, y: 0 })?.style ?? { attrs: 0 }, Attr.reverse)).toBe(true);
    }
  });

  test('when its words wrap, it is framed heavy, as a popover is', () => {
    expect(toText(tooltipBuffer({ width: 10, height: 4 }))).toMatchInlineSnapshot(`
      "┏━━━━━━━━┓
      ┃        ┃
      ┃        ┃
      ┗━━━━━━━━┛"
    `);
  });

  test('it is at most 40 cells wide', () => {
    expect(TOOLTIP_MAX_COLS).toBe(40);
  });
});

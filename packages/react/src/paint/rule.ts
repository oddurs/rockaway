/**
 * The rule painter (cairn 0085): the same geometry as CSS hairlines.
 *
 * For readers who want crisp lines at any zoom rather than box characters.
 * The geometry is identical — it reads the same edge weights — so a screen
 * measures the same in cells whichever painter drew it.
 *
 * Rules sit on the cell boundary and take no cell, which is what lets a
 * screen switch painters without reflowing.
 */
import type { Buffer, Edges } from '@rockaway/grid';
import type { PaintOptions } from './glyph.ts';

const SIDES = ['north', 'east', 'south', 'west'] as const;
const CSS_SIDE = { north: 'Top', east: 'Right', south: 'Bottom', west: 'Left' } as const;

/** 0 none, 1 light, 2 heavy, 3 double: the widths and styles a rule draws with. */
const STROKE: Readonly<Record<number, { width: string; style: string }>> = {
  1: { width: '1px', style: 'solid' },
  2: { width: '2px', style: 'solid' },
  3: { width: '3px', style: 'double' },
};

export function paintRule(
  buffer: Buffer,
  target: HTMLElement,
  { prefix = 'rk' }: PaintOptions = {},
): void {
  const doc = target.ownerDocument;
  target.setAttribute('aria-hidden', 'true');
  target.dataset.rkPainter = 'rule';
  target.replaceChildren();

  for (let y = 0; y < buffer.height; y++) {
    for (let x = 0; x < buffer.width; x++) {
      const edges = buffer.edgesAt({ x, y });
      if (!edges || SIDES.every((side) => edges[side] === 0)) continue;

      const mark = doc.createElement('div');
      mark.className = `${prefix}-rule`;
      mark.style.position = 'absolute';
      mark.style.left = `calc(var(--rk-cell-width) * ${x})`;
      mark.style.top = `calc(var(--rk-cell-height) * ${y})`;
      mark.style.width = 'var(--rk-cell-width)';
      mark.style.height = 'var(--rk-cell-height)';

      for (const side of SIDES) {
        const stroke = STROKE[edges[side] as number];
        if (!stroke) continue;
        // A rule on the boundary is drawn from the midpoint of the cell, so
        // two cells meeting draw one line rather than two.
        const which = CSS_SIDE[side];
        mark.style[`border${which}Width` as 'borderTopWidth'] = stroke.width;
        mark.style[`border${which}Style` as 'borderTopStyle'] = stroke.style;
        mark.style[`border${which}Color` as 'borderTopColor'] = 'var(--rk-border-default)';
      }

      target.append(mark);
    }
  }
}

/** Which sides of a cell a rule would draw, for tests and for the conformance report. */
export function ruledSides(edges: Edges): string[] {
  return SIDES.filter((side) => edges[side] !== 0);
}

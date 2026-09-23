/**
 * The rule painter (cairn 0085): the same geometry as CSS hairlines.
 *
 * For readers who want crisp lines at any zoom rather than box characters.
 * It reads the same edge weights the glyph painter does, so a screen measures
 * the same in cells whichever painter drew it.
 *
 * An edge is a stroke from the centre of its cell toward that side — not a
 * border on the cell's box (cairn 0089). Half-strokes are what let two cells
 * join into one line and what makes a corner meet in the middle, exactly
 * where `┌` puts it.
 */
import type { Buffer, Edges, Weight } from '@rockaway/grid';
import type { PaintOptions } from './glyph.ts';

const SIDES = ['north', 'east', 'south', 'west'] as const;
type Side = (typeof SIDES)[number];

/** Width in px per weight; double draws as two hairlines. */
const THICKNESS: Readonly<Record<Weight, number>> = { 0: 0, 1: 1, 2: 2, 3: 3 };

function stroke(doc: Document, side: Side, weight: Weight, prefix: string): HTMLElement {
  const el = doc.createElement('div');
  el.className = `${prefix}-stroke`;
  el.dataset.side = side;
  const thickness = `${THICKNESS[weight]}px`;
  const style = el.style;
  style.position = 'absolute';
  style.background = 'var(--rk-border-default)';

  // Each stroke runs from the centre of the cell to one edge, and is centred
  // on the line itself, so two neighbours overlap into one continuous run.
  if (side === 'north' || side === 'south') {
    style.width = thickness;
    style.height = 'calc(var(--rk-cell-height) / 2 + 0.5px)';
    style.left = `calc(50% - ${THICKNESS[weight] / 2}px)`;
    style[side === 'north' ? 'top' : 'bottom'] = '0';
    if (side === 'north') style.top = '0';
  } else {
    style.height = thickness;
    style.width = 'calc(var(--rk-cell-width) / 2 + 0.5px)';
    style.top = `calc(50% - ${THICKNESS[weight] / 2}px)`;
    style[side === 'west' ? 'left' : 'right'] = '0';
  }

  if (side === 'north') style.top = '0';
  if (side === 'south') style.bottom = '0';
  if (weight === 3) {
    // Double: two hairlines with a gap, the way ═ reads.
    style.background = 'none';
    style.borderStyle = 'double';
    style.borderColor = 'var(--rk-border-default)';
    if (side === 'north' || side === 'south') style.borderInlineStartWidth = '3px';
    else style.borderBlockStartWidth = '3px';
  }
  return el;
}

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

      const cell = doc.createElement('div');
      cell.className = `${prefix}-rule`;
      cell.style.position = 'absolute';
      cell.style.left = `calc(var(--rk-cell-width) * ${x})`;
      cell.style.top = `calc(var(--rk-cell-height) * ${y})`;
      cell.style.width = 'var(--rk-cell-width)';
      cell.style.height = 'var(--rk-cell-height)';

      for (const side of SIDES) {
        const weight = edges[side];
        if (weight !== 0) cell.append(stroke(doc, side, weight, prefix));
      }
      target.append(cell);
    }
  }
}

/** Which sides of a cell a rule would draw, for tests and for the conformance report. */
export function ruledSides(edges: Edges): string[] {
  return SIDES.filter((side) => edges[side] !== 0);
}

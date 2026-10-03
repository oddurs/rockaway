/**
 * `Divider`: the pure half (cairn 0126).
 *
 * The rule, drawn into any draft, and the rule on its own as a buffer. No React and no client boundary, so a server component, a static
 * renderer or a test can call it; `divider.tsx` imports it from here.
 */
import {
  addEdges,
  Buffer,
  borderSets,
  type Draft,
  drawHLine,
  drawLabel,
  drawVLine,
  type Edges,
  type Rect,
  rect,
  type Size,
} from '@rockaway/grid';
import { type Glyphs, themeGlyphs } from '@rockaway/tokens';
import type { DividerOptions } from './divider.tsx';

/**
 * Draw a rule along `line` — one cell tall for a horizontal rule, one cell
 * wide for a vertical one — into a draft that may already hold a frame.
 */
export function drawRule(
  draft: Draft,
  line: Rect,
  options: DividerOptions = {},
  glyphs: Glyphs = themeGlyphs.default,
): void {
  const set = borderSets[options.border ?? glyphs.borderSet];
  const horizontal = (options.orientation ?? 'horizontal') === 'horizontal';
  const length = horizontal ? line.width : line.height;
  if (length < 1) return;

  const draw = { set };
  if (horizontal) drawHLine(draft, { x: line.x, y: line.y }, length, draw);
  else drawVLine(draft, { x: line.x, y: line.y }, length, draw);

  if (options.ends === 'joined') {
    // The crossing, not the corner: added as edges, so the glyph is always the
    // table's answer — ├ ┤ for a horizontal rule, ┬ ┴ for a vertical one.
    const crossing: Partial<Edges> = horizontal
      ? { north: set.weight, south: set.weight }
      : { east: set.weight, west: set.weight };
    const last = horizontal
      ? { x: line.x + length - 1, y: line.y }
      : { x: line.x, y: line.y + length - 1 };
    addEdges(draft, { x: line.x, y: line.y }, crossing, draw);
    addEdges(draft, last, crossing, draw);
  }

  if (horizontal && options.label !== undefined && options.label !== '') {
    // A label owns its cells and stops short of any rule crossing this one,
    // whichever was drawn first (0175).
    drawLabel(draft, rect(line.x, line.y, line.width, 1), options.label, {
      set,
      ellipsis: glyphs.mark.ellipsis,
      ...(options.labelAlign === undefined ? {} : { align: options.labelAlign }),
    });
  }
}

/** The rule on its own, as a buffer: what the component draws and the tests read. */
export function dividerBuffer(
  size: Size,
  options: DividerOptions = {},
  glyphs: Glyphs = themeGlyphs.default,
): Buffer {
  return Buffer.create(size).draw((draft) => {
    drawRule(draft, rect(0, 0, size.width, size.height), options, glyphs);
  });
}

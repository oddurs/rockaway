/**
 * `Divider`: the pure half (cairn 0126).
 *
 * The rule, drawn into any draft, and the rule on its own as a buffer. No
 * React and no client boundary, so a server component, a static renderer or a
 * test can call them; `divider.tsx` imports them from here.
 */
import {
  Attr,
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
  type Style,
} from '@rockaway/grid';
import { type Glyphs, marks, themeGlyphs } from '@rockaway/tokens';
import type { DividerOptions } from './divider.tsx';

/**
 * The colour of a line: the ordinary edge, `border.default`. Each cell carries
 * it, rather than the layer, so a line is a run of its own and the text set
 * into it keeps the text colour; and so the line is the same colour on a page,
 * in ANSI, and wherever else the buffer goes.
 */
const LINE: Style = { fg: 'border.default', attrs: Attr.none };

/** A label is text set into the line, so it is drawn in the text colour. */
const TEXT: Style = { fg: 'fg.default', attrs: Attr.none };

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

  const draw = { set, style: LINE };
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
    // An open end is a half stroke. A label set straight after it would leave
    // that half cell stranded, `╶ files`, so on an open rule the label keeps a
    // whole cell of line between it and either end: `╶─ files ──╴`. Within that,
    // it owns its cells and stops short of any rule crossing this one,
    // whichever was drawn first (0175).
    const inset = options.ends === 'joined' ? 0 : 1;
    const room = rect(line.x + inset, line.y, Math.max(0, line.width - 2 * inset), 1);
    drawLabel(draft, room, options.label, {
      set,
      style: TEXT,
      lineStyle: LINE,
      // A rule drawn in ASCII truncates in ASCII, whatever the theme.
      ellipsis: set.ascii ? marks.ascii.ellipsis : glyphs.mark.ellipsis,
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

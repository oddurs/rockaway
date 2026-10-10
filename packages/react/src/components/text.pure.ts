/**
 * `Text`: the pure half (cairn 0126, 0297).
 *
 * Type sized in rows (decision 0296). Size N fills N rows: the font is scaled
 * so that its glyph box, ascent plus descent, is exactly N rows tall at the
 * density in force. Across, the letters keep the scaled font's own advance,
 * which is not a whole number of columns, so a run set inline takes a box
 * rounded up to whole cells, and the rest of its last cell is padding.
 *
 * No React and no client boundary, so a server component, a static renderer
 * or a test can call these; `text.tsx` imports them from here.
 */
import { Buffer, drawText, stringWidth } from '@rockaway/grid';
import { contentHeight, lineBox } from '@rockaway/tokens';

/** The sizes, in rows. One row is ordinary text, which needs no component. */
export type TextSize = 2 | 3 | 4;
export const textSizes: readonly TextSize[] = [2, 3, 4];

/** What a size depends on besides itself: the line box and the face. */
export interface TextMetrics {
  /** The line box over the font size: the density (`lineBox`). Normal by default. */
  readonly line?: number;
  /** The face's ascent plus descent over the em (`contentHeight`). IBM Plex Mono's by default (0295). */
  readonly content?: number;
}

/**
 * How far under a whole cell a run's width may come and still be that cell,
 * as a share of one. The stylesheet takes the same off before it rounds, so a
 * run whose width is a whole number of cells, give or take the arithmetic,
 * does not gain a cell of padding.
 */
export const TEXT_SLACK: number = 1 / 256;

/** How many times the ordinary font size a size is drawn at. */
export function textScale(size: TextSize, metrics: TextMetrics = {}): number {
  const line = metrics.line ?? lineBox.normal;
  const content = metrics.content ?? contentHeight['ibm-plex'];
  return (size * line) / content;
}

/**
 * The columns a run takes set inline: its width at the ordinary size, scaled,
 * and rounded up to whole cells. The stylesheet takes the wider of this and
 * the run as the scaled face lays it out, so this is the fewest a page draws.
 * Where a face is hinted (Chromium on Linux rounds each scaled advance to a
 * whole pixel), a run can be wider than its ordinary width scaled, and take a
 * cell more.
 */
export function textCols(text: string, size: TextSize, metrics: TextMetrics = {}): number {
  return Math.max(0, Math.ceil(stringWidth(text) * textScale(size, metrics) - TEXT_SLACK));
}

/**
 * A run set inline, as cells: what `screenshot()` reads back. Its characters
 * from the first cell of its first row, one to a cell, then blank to the end
 * of the box; the rows under it are blank. A reader copying it gets the
 * characters alone, which is what the cells say.
 */
export function textBuffer(text: string, size: TextSize, metrics: TextMetrics = {}): Buffer {
  return Buffer.create({ width: textCols(text, size, metrics), height: size }).draw((draft) => {
    drawText(draft, { x: 0, y: 0 }, text);
  });
}

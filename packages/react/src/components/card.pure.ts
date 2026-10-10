/**
 * `Card`: the pure half (cairn 0321).
 *
 * A card is a frame whose inside is rhythm (0311): padded by the comfort's
 * half-steps inside the border, its blocks a rhythm gap apart, and its outer
 * box whole rows, so a grid of cards lines up and the lines between them meet.
 * No React and no client boundary; `card.tsx` has the component.
 */
import {
  type Buffer,
  type Comfort,
  drawText,
  flow,
  rhythm,
  type Size,
  stringWidth,
  wrap,
} from '@rockaway/grid';
import { type Glyphs, themeGlyphs } from '@rockaway/tokens';
import { frameBuffer } from './frame.pure.ts';

export interface CardOptions {
  /** Set into the top edge, as a frame's title is. */
  readonly title?: string;
}

/** The card's chrome at a size: its frame, with the title in the top edge. */
export function cardBuffer(
  size: Size,
  options: CardOptions = {},
  glyphs: Glyphs = themeGlyphs.default,
): Buffer {
  return frameBuffer(size, options.title === undefined ? {} : { title: options.title }, glyphs);
}

/** The smallest card: the corners, and room for its title in the top edge. */
export function cardSmallest(title: string | undefined): Size {
  return { width: title === undefined ? 3 : stringWidth(title) + 6, height: 3 };
}

export interface CardTextOptions extends CardOptions {
  /** The card's width, in cells, border included. */
  readonly cols: number;
  /** How generous its padding and gaps are; comfortable by default, as `Card`'s is. */
  readonly comfort?: Comfort;
}

/** Cells across inside the border and the padding. */
export function cardInside(cols: number, comfort: Comfort = 'comfortable'): number {
  return Math.max(1, cols - 2 - rhythm[comfort].padX);
}

/**
 * A card as cells, around blocks of text: the text model of `Card` and its
 * snapshot. Each block wraps to the room inside; the blocks are a rhythm gap
 * apart, the run of them closed to whole rows, and padded half-steps inside
 * the border. A line half a row down reads as the row below it, as
 * `screenshot()` reads one off the page.
 */
export function cardText(
  blocks: readonly string[],
  options: CardTextOptions,
  glyphs: Glyphs = themeGlyphs.default,
): Buffer {
  const comfort = options.comfort ?? 'comfortable';
  const r = rhythm[comfort];
  const inside = cardInside(options.cols, comfort);
  const lines = blocks.map((block) => wrap(block, inside));
  const laid = flow(
    lines.map((l) => l.length * 2),
    r.gap,
  );
  // Border, padding, the flow's whole rows, padding, border: whole rows, since
  // the padding is the same above and below.
  const height = 2 + r.padY + laid.rows;
  const left = 1 + r.padX / 2;
  const chrome = cardBuffer({ width: options.cols, height }, options, glyphs);
  return chrome.draw((draft) => {
    lines.forEach((block, i) => {
      const top = 2 + r.padY + (laid.offsets[i] ?? 0);
      block.forEach((line, j) => {
        drawText(draft, { x: left, y: Math.ceil(top / 2) + j }, line);
      });
    });
  });
}

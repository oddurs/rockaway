/**
 * `Tooltip`: the pure half (cairn 0126, 0043).
 *
 * The tooltip's chrome as cells. No React and no client boundary, so a
 * server, a static renderer or a test can call it; `tooltip.tsx` draws through
 * the overlay contract, which draws the same buffer.
 */
import type { Buffer, Size } from '@rockaway/grid';
import type { Glyphs } from '@rockaway/tokens';
import { themeGlyphs } from '@rockaway/tokens';
import { overlayBuffer } from './overlay.pure.ts';

/** The widest a tooltip is, in cells, its frame or its reverse-video ends included. */
export const TOOLTIP_MAX_COLS = 40;

/**
 * A tooltip's chrome as a buffer: one row of reverse video when its words
 * fit on one row, the words' ground; framed heavy, as a popover, when they
 * wrap.
 */
export function tooltipBuffer(size: Size, glyphs: Glyphs = themeGlyphs.default): Buffer {
  return overlayBuffer(size, { kind: 'tooltip' }, glyphs);
}

/**
 * The cell, and density (cairn 0090, 0074).
 *
 * The cell is the font's: one character wide, one line box tall. Space is
 * counted in cells, so it is written in `ch` across and `lh` down — the two
 * units that mean exactly that — and a theme never states a pixel.
 *
 * Density is the line box. Nothing about a layout changes between densities;
 * the cells simply get taller, which is also how a one-row control reaches a
 * 44px touch target without a coordinate moving.
 */
import type { Density } from './inputs.ts';

/** Line box per density, as a multiple of the font size. */
export const lineBox: Readonly<Record<Density, number>> = {
  dense: 1,
  normal: 1.25,
  airy: 1.5,
  /** Coarse pointers: the same grid, twice as tall (0074). */
  touch: 2,
};

/** Space steps, in cells. Whole cells only: there is no half a cell. */
export const spaceSteps = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16] as const;

/** Control heights, in rows. A bordered control is three: border, content, border. */
export const controlRows = { sm: 1, md: 1, lg: 3 } as const;

/** How wide a screen is, in cells, at the sizes terminals have always used. */
export const breakpoints = { narrow: 40, medium: 60, wide: 80, full: 120 } as const;

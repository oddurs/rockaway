/**
 * Measuring the cell (cairn 0086, 0074).
 *
 * The cell is the font's, not a number we picked: one character wide, one line
 * box tall. Measuring it rather than assuming it is what makes browser zoom,
 * a reader's font size and a different monospace family all work untouched.
 */
export interface CellMetrics {
  readonly width: number;
  readonly height: number;
}

/**
 * A number to fall back on when a measurement comes back empty, as in a
 * detached element: a 16px system mono at the default density, whose line box
 * is 24px (0197). `Screen` never draws with it: until it has measured, its
 * cell is `1ch` by `1lh`, the font's own (cairn 0126).
 */
export const DEFAULT_CELL: CellMetrics = { width: 8.4, height: 24 };

const PROBE = '0'.repeat(50);

/**
 * Measure one cell of the font `el` is rendering in. Layout rounds a box up to
 * 1/64px, a constant that a single probe fifty characters wide spreads over
 * the cell as a bias (9.6003 for 9.6, which made a box of 120 cells hold 119
 * of them). So the cell is the difference between a probe of a hundred
 * characters and one of fifty: the rounding cancels and the advance is left.
 */
export function measureCell(el: HTMLElement): CellMetrics {
  const doc = el.ownerDocument;
  const probe = (text: string): HTMLElement => {
    const span = doc.createElement('span');
    span.textContent = text;
    span.setAttribute('aria-hidden', 'true');
    span.style.position = 'absolute';
    span.style.visibility = 'hidden';
    span.style.whiteSpace = 'pre';
    span.style.pointerEvents = 'none';
    el.append(span);
    return span;
  };
  const [short, long] = [probe(PROBE), probe(PROBE + PROBE)];
  const [one, two] = [short.getBoundingClientRect(), long.getBoundingClientRect()];
  const style = doc.defaultView?.getComputedStyle(el);
  const lineHeight = Number.parseFloat(style?.lineHeight ?? '');
  short.remove();
  long.remove();

  const width = (two.width - one.width) / PROBE.length;
  const height = Number.isFinite(lineHeight) && lineHeight > 0 ? lineHeight : one.height;
  return {
    width: width > 0 ? width : DEFAULT_CELL.width,
    height: height > 0 ? height : DEFAULT_CELL.height,
  };
}

/**
 * Two questions about a length in cells, and the grace each takes (cairn 0228).
 *
 * Layout rounds every box to the engine's unit (1/64px; 1/60px in Gecko), and
 * the cell is the font's true advance, so a length meant to be n cells
 * measures a hair either side of n.
 *
 * How many cells FIT in a box (`cellsIn`): a screen in its container, a sheet
 * in the viewport. The box is the page's, and its edge is hard: cells drawn
 * past it are cut off, or give its scroller a sliver to scroll. So the grace
 * is what one box's rounding can take from an exact n cells, two of the
 * coarsest layout unit, and nothing anyone can see past the edge.
 *
 * How many cells COVER a length (`cellsCovering`): a select's list as wide as
 * its trigger. The length is content laid out in cells, often many boxes end
 * to end, and their errors add: a trigger of five runs came out a few
 * hundredths of a pixel over thirty cells, and took thirty-one. One cell too
 * many is the failure, and a surface a sliver narrower than its trigger is
 * not, so the grace is a fraction of the cell: a sixteenth, over thirty layout
 * units at any reading size, and a cell's worth wrong in no engine.
 *
 * A long row of cells is not left to the grace: it is laid out as a screen
 * lays out its runs, each edge rounded from the row's start (screen.css), and
 * comes out exact.
 */
export const CELL_SNAP: number = 1 / 32;
export const CELL_COVER_GRACE: number = 1 / 16;

/** How many whole cells fit in a box. Never negative, never fractional. */
export function cellsIn(pixels: number, cell: number): number {
  if (!Number.isFinite(pixels) || !Number.isFinite(cell) || cell <= 0) return 0;
  return Math.max(0, Math.floor((pixels + CELL_SNAP) / cell));
}

/**
 * How many whole cells cover a length: the dual of `cellsIn`, for a surface
 * at least as wide as something laid out in cells. A length a sixteenth of a
 * cell over n cells is n.
 */
export function cellsCovering(pixels: number, cell: number): number {
  if (!Number.isFinite(pixels) || !Number.isFinite(cell) || cell <= 0) return 0;
  return Math.max(0, Math.ceil(pixels / cell - CELL_COVER_GRACE));
}

/**
 * Rounding a position in cells, the same in every engine (0128, #195). A
 * surface centred in an odd number of spare cells sits on a half cell
 * exactly, and each engine's float lengths put it a hair either side
 * (Chromium's 1/64px, Firefox's 1/60px), so a plain `Math.round` sent it a
 * column left in one engine and right in another. A position is a count of
 * cells, so the tie is a share of a cell: a hundredth.
 */
export const CELL_TIE: number = 0.01;

/** The nearest whole cell to a position in cells; a tie goes to the start, left or up. */
export function nearestCell(cells: number): number {
  return Math.ceil(cells - 0.5 - CELL_TIE);
}

/** The whole cell a position is in; a position a hair under a whole cell is that cell. */
export function floorCell(cells: number): number {
  return Math.floor(cells + CELL_TIE);
}

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
 * Measure one cell of the font `el` is rendering in. The probe is fifty
 * characters wide, so sub-pixel advances average out instead of rounding.
 */
export function measureCell(el: HTMLElement): CellMetrics {
  const doc = el.ownerDocument;
  const probe = doc.createElement('span');
  probe.textContent = PROBE;
  probe.setAttribute('aria-hidden', 'true');
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.style.whiteSpace = 'pre';
  probe.style.pointerEvents = 'none';
  el.append(probe);

  const rect = probe.getBoundingClientRect();
  const style = doc.defaultView?.getComputedStyle(el);
  const lineHeight = Number.parseFloat(style?.lineHeight ?? '');
  probe.remove();

  const width = rect.width / PROBE.length;
  const height = Number.isFinite(lineHeight) && lineHeight > 0 ? lineHeight : rect.height;
  return {
    width: width > 0 ? width : DEFAULT_CELL.width,
    height: height > 0 ? height : DEFAULT_CELL.height,
  };
}

/**
 * How far a length laid out as whole cells can be from them (cairn 0228): a
 * sixteenth of a cell. Layout rounds every box edge to the engine's unit
 * (1/64px; 1/60px in Gecko), and the cell is the font's true advance, so a
 * box of n cells measures a hair either side of n. Boxes laid end to end add
 * their errors: a select's trigger, five runs in a row, came out a few
 * hundredths of a pixel over thirty cells. So the grace is not a pixel count,
 * which some number of boxes always beats, but a fraction of the cell: a
 * sixteenth is over thirty layout units at any reading size, and a length
 * that far from whole cells is a cell's worth wrong in no engine.
 *
 * The cost is at the other end: a box a sixteenth of a cell short of n cells
 * is drawn as n, a sliver past its edge, rather than as n - 1 with a cell
 * missing at the side. The stylesheets use the same sixteenth wherever they
 * round to cells (field, fieldset and table).
 */
export const CELL_GRACE: number = 1 / 16;

/** How many whole cells fit. Never negative, never fractional. */
export function cellsIn(pixels: number, cell: number): number {
  if (!Number.isFinite(pixels) || !Number.isFinite(cell) || cell <= 0) return 0;
  return Math.max(0, Math.floor(pixels / cell + CELL_GRACE));
}

/**
 * How many whole cells it takes to cover a length: the dual of `cellsIn`, for
 * a surface at least as wide as something else, as a select's list is as
 * wide as its trigger. A length a sixteenth of a cell over n cells is n.
 */
export function cellsCovering(pixels: number, cell: number): number {
  if (!Number.isFinite(pixels) || !Number.isFinite(cell) || cell <= 0) return 0;
  return Math.max(0, Math.ceil(pixels / cell - CELL_GRACE));
}

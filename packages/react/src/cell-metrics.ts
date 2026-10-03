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
 * detached element. `Screen` never draws with it: until it has measured, its
 * cell is `1ch` by `1lh`, the font's own (cairn 0126).
 */
export const DEFAULT_CELL: CellMetrics = { width: 8.4, height: 20 };

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
 * Layout snaps every box to 1/64px, and the cell is the font's true advance,
 * so a box exactly n cells wide can lay out a hair under n cells: 51 cells of
 * 9.6328125px is 491.273px, laid out as 491.266px. A box within a snap or two
 * of a whole cell is that cell. No more than that: a box any shorter really is
 * short, and n cells drawn in it would be cut off at its edge.
 */
const SNAP = 1 / 32;

/** How many whole cells fit. Never negative, never fractional. */
export function cellsIn(pixels: number, cell: number): number {
  if (!Number.isFinite(pixels) || !Number.isFinite(cell) || cell <= 0) return 0;
  return Math.max(0, Math.floor((pixels + SNAP) / cell));
}

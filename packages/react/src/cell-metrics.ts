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

/** A guess, used only before the first measurement and on a server. */
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

  const width = layoutUnits(rect.width / PROBE.length);
  const height = layoutUnits(
    Number.isFinite(lineHeight) && lineHeight > 0 ? lineHeight : rect.height,
  );
  return {
    width: width > 0 ? width : DEFAULT_CELL.width,
    height: height > 0 ? height : DEFAULT_CELL.height,
  };
}

/**
 * A length a browser can lay out exactly: a whole number of sixty-fourths of
 * a pixel. A run of eight cells is sized `8 × cell`, and a single cell `1 × cell`
 * — if the cell were not exact, each would round on its own, and the same
 * column would land a fraction of a pixel apart in different rows (cairn 0117).
 */
function layoutUnits(px: number): number {
  return Math.round(px * 64) / 64;
}

/** How many whole cells fit. Never negative, never fractional. */
export function cellsIn(pixels: number, cell: number): number {
  if (!Number.isFinite(pixels) || !Number.isFinite(cell) || cell <= 0) return 0;
  return Math.max(0, Math.floor(pixels / cell));
}

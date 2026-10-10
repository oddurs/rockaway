/**
 * The cell a screen draws in, in pixels (cairn 0126).
 *
 * `--rk-cell-width` is a measurement in pixels once `Screen` has measured, and
 * then it is read as it is. Before that — on a server-rendered page, or one
 * whose JavaScript never ran — it is `1ch` and `1lh`, so it is resolved by
 * laying a box of cells out inside the screen.
 *
 * Reading must not change the page when it can help it. `screenshot()` is
 * called inside `waitFor`, which runs its callback again on every change to
 * the document: a probe added and removed is a change, so a callback that
 * kept failing ran itself forever, in microtasks, and froze the page instead
 * of failing (the Tabs hang found under 0216).
 */
const SPAN = 1000;

const PIXELS = /^\s*(\d+(?:\.\d+)?)px\s*$/;

export function cellOf(screen: HTMLElement): { readonly width: number; readonly height: number } {
  const style = screen.ownerDocument.defaultView?.getComputedStyle(screen);
  const width = PIXELS.exec(style?.getPropertyValue('--rk-cell-width') ?? '')?.[1];
  const height = PIXELS.exec(style?.getPropertyValue('--rk-cell-height') ?? '')?.[1];
  if (width !== undefined && height !== undefined) {
    return { width: Number(width), height: Number(height) };
  }
  return probe(screen);
}

/** Lay a thousand cells out inside the screen, and read their size. */
function probe(screen: HTMLElement): { readonly width: number; readonly height: number } {
  const box = screen.ownerDocument.createElement('div');
  box.setAttribute('aria-hidden', 'true');
  box.style.position = 'absolute';
  box.style.visibility = 'hidden';
  // A thousand cells, not one: a box's size is rounded to the browser's layout
  // unit (1/64px), and one cell's rounding would be the whole error.
  box.style.inlineSize = `calc(var(--rk-cell-width) * ${SPAN})`;
  box.style.blockSize = `calc(var(--rk-cell-height) * ${SPAN})`;
  screen.append(box);
  const { width, height } = box.getBoundingClientRect();
  box.remove();
  return { width: width / SPAN, height: height / SPAN };
}

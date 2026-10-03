/**
 * The cell a screen draws in, in pixels (cairn 0126).
 *
 * `--rk-cell-width` is a measurement in pixels once `Screen` has measured, but
 * `1ch` and `1lh` before it has — on a server-rendered page, or one whose
 * JavaScript never ran — so it is resolved by laying a box of exactly one cell
 * out inside the screen, rather than by parsing the property.
 */
const SPAN = 1000;

export function cellOf(screen: HTMLElement): { readonly width: number; readonly height: number } {
  const probe = screen.ownerDocument.createElement('div');
  probe.setAttribute('aria-hidden', 'true');
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  // A thousand cells, not one: a box's size is rounded to the browser's layout
  // unit (1/64px), and one cell's rounding would be the whole error.
  probe.style.inlineSize = `calc(var(--rk-cell-width) * ${SPAN})`;
  probe.style.blockSize = `calc(var(--rk-cell-height) * ${SPAN})`;
  screen.append(probe);
  const { width, height } = probe.getBoundingClientRect();
  probe.remove();
  return { width: width / SPAN, height: height / SPAN };
}

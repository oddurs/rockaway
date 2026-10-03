/**
 * The cell a screen draws in, in pixels (cairn 0126).
 *
 * `--rk-cell-width` is a measurement in pixels once `Screen` has measured, but
 * `1ch` and `1lh` before it has — on a server-rendered page, or one whose
 * JavaScript never ran — so it is resolved by laying a box of exactly one cell
 * out inside the screen, rather than by parsing the property.
 */
export function cellOf(screen: HTMLElement): { readonly width: number; readonly height: number } {
  const probe = screen.ownerDocument.createElement('div');
  probe.setAttribute('aria-hidden', 'true');
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.style.inlineSize = 'var(--rk-cell-width)';
  probe.style.blockSize = 'var(--rk-cell-height)';
  screen.append(probe);
  const { width, height } = probe.getBoundingClientRect();
  probe.remove();
  return { width, height };
}

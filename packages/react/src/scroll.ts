/**
 * Overflow marks where CSS cannot show them (cairn 0218).
 *
 * A region that scrolls across marks each edge with more past it, `‹` and `›`
 * (0208). The marks come from a scroll-state container query, which only some
 * engines have. Everywhere else this sets the same state on the region as
 * `data-rk-more` — `start`, `end`, both or neither — and the stylesheet shows
 * the marks from that instead.
 *
 * It is an enhancement and nothing more. With JavaScript off, a browser
 * without the query draws no marks, and the region still scrolls, which is
 * where it was before. In a browser with the query this does nothing, unless
 * asked to (`force`), so the two never disagree about a mark.
 *
 * No React here: a page of prose with no components calls it as well.
 */

/** Every region that can show the marks, as `scroll.css` names them. */
const REGIONS = '.rk-scroll-marks, .rk-prose pre';

/** Whether the stylesheet can show the marks on its own, from a scroll-state query. */
export function scrollStateQueries(): boolean {
  return typeof CSS !== 'undefined' && CSS.supports('container-type', 'scroll-state');
}

/**
 * Write one region's state: which of its edges have more past them. Logical,
 * as the query is: in a right-to-left region the start is on the right, and
 * its scroll position counts down from zero.
 */
export function markOverflow(region: HTMLElement): void {
  const offset = Math.abs(region.scrollLeft);
  const more = [
    offset > 0.5 && 'start',
    offset + region.clientWidth < region.scrollWidth - 0.5 && 'end',
  ].filter(Boolean);
  if (more.length === 0) region.removeAttribute('data-rk-more');
  else region.setAttribute('data-rk-more', more.join(' '));
}

export interface OverflowMarkOptions {
  /** Set the state even where the stylesheet's query would show the marks. */
  readonly force?: boolean;
}

/**
 * Keep the overflow marks of every region in `root`, and `root` itself, up to
 * date: when one scrolls, when one or what it holds changes size, and when a
 * region is added. Returns a function that stops it and clears the state.
 */
export function watchOverflowMarks(
  root: Document | HTMLElement = document,
  options: OverflowMarkOptions = {},
): () => void {
  if (!options.force && scrollStateQueries()) return () => {};
  const regions = new Set<HTMLElement>();
  const resized = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const region = (entry.target as HTMLElement).closest<HTMLElement>(REGIONS);
      if (region && regions.has(region)) markOverflow(region);
    }
  });
  const watch = (region: HTMLElement): void => {
    if (regions.has(region)) return;
    regions.add(region);
    resized.observe(region);
    for (const child of region.children) resized.observe(child);
    markOverflow(region);
  };
  const find = (): void => {
    if (root instanceof HTMLElement && root.matches(REGIONS)) watch(root);
    for (const region of root.querySelectorAll<HTMLElement>(REGIONS)) watch(region);
  };

  // Scroll does not bubble; a listener on the root that captures hears it.
  const scrolled = (event: Event): void => {
    const target = event.target;
    if (target instanceof HTMLElement && regions.has(target)) markOverflow(target);
  };
  root.addEventListener('scroll', scrolled, { capture: true, passive: true });
  const added = new MutationObserver(find);
  added.observe(root, { childList: true, subtree: true });
  find();

  return () => {
    root.removeEventListener('scroll', scrolled, { capture: true });
    added.disconnect();
    resized.disconnect();
    for (const region of regions) region.removeAttribute('data-rk-more');
    regions.clear();
  };
}

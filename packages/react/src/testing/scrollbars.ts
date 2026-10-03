/**
 * No native scrollbars (cairn 0207, 0208).
 *
 * A region that scrolls hides the browser's scrollbar and shows its position
 * in cells. The check reads computed styles rather than pixels, because a
 * headless browser hides scrollbars: there, a native bar measures 0px whether
 * the rule is missing or not, and only a reader with a mouse attached would
 * ever meet it. So: any element whose computed overflow scrolls, on either
 * axis, must have `scrollbar-width: none`.
 */

/** A scrolling element that would draw the browser's own scrollbar. */
export interface NativeScrollbar {
  /** The element, as a selector-ish description. */
  readonly element: string;
  /** Its computed `overflow-x` and `overflow-y`. */
  readonly overflow: string;
  /** Its computed `scrollbar-width`. */
  readonly scrollbarWidth: string;
}

/** Overflow values that make a box scroll, and so give it a scrollbar. */
const SCROLLS = new Set(['auto', 'scroll', 'overlay']);

function describe(el: Element): string {
  const id = el.id ? `#${el.id}` : '';
  const cls =
    typeof el.className === 'string' && el.className
      ? `.${el.className.trim().split(/\s+/).join('.')}`
      : '';
  const testId = (el as HTMLElement).dataset?.testid;
  return `${el.tagName.toLowerCase()}${id}${cls}${testId ? `[${testId}]` : ''}`;
}

/** Every element at or under `root` that scrolls with a native scrollbar showing. */
export function checkScrollbars(root: Element): NativeScrollbar[] {
  const found: NativeScrollbar[] = [];
  const view = root.ownerDocument.defaultView;
  if (!view) return found;
  for (const el of [root, ...root.querySelectorAll('*')]) {
    const style = view.getComputedStyle(el);
    if (!SCROLLS.has(style.overflowX) && !SCROLLS.has(style.overflowY)) continue;
    const width = style.getPropertyValue('scrollbar-width');
    if (width === 'none') continue;
    found.push({
      element: describe(el),
      overflow: `${style.overflowX} ${style.overflowY}`,
      scrollbarWidth: width,
    });
  }
  return found;
}

/** Throws, listing each one, if anything under `root` would draw a native scrollbar. */
export function expectNoNativeScrollbars(root: Element): void {
  const found = checkScrollbars(root);
  if (found.length === 0) return;
  const lines = found.map(
    (bar) => `  ${bar.element}  overflow ${bar.overflow}, scrollbar-width ${bar.scrollbarWidth}`,
  );
  throw new Error(
    `a native scrollbar (0207): give the scrolling element rk-scroll, and show its position in cells\n${lines.join('\n')}`,
  );
}

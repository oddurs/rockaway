'use client';

/**
 * `SkipLink` (cairn 0249): the first thing a keyboard meets, and the way past
 * everything that repeats on every page.
 *
 * It is an anchor to the id it is given, first in the reading order, and out
 * of sight until it has focus. Then it is drawn on the grid: a run of reversed
 * cells, the label with a cell of air either side, one row tall, at the
 * top-left of the screen it is in (its nearest positioned ancestor, which a
 * `Screen` is). It overlays that corner rather than pushing anything down, so
 * showing it moves nothing (0118), and hiding it again is a clip, not a size.
 *
 * Its words are the author's and it draws no glyph, so it reads the same in
 * every theme, ASCII included. In forced colors it keeps its reversal as the
 * reader's text and canvas swapped (0181).
 *
 * Activating it follows the anchor, which with no script at all moves the
 * place the next Tab starts from. With script it also moves focus to the
 * target, so a screen reader starts reading there: a target that cannot take
 * focus is given `tabindex="-1"` first, which puts it in no tab order.
 *
 * The same markup without React is `<a class="rk-skip-link" href="#main">`
 * (with `data-rk-control` for the conformance levels): the stylesheet is all
 * it needs to show and hide.
 */
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react';
import { cx } from '../cx.ts';

export interface SkipLinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'children'> {
  /** The id of the element to jump to, without the `#`: usually the page's `main`. */
  readonly target: string;
  /** What it says. Default "Skip to content". */
  readonly children?: ReactNode;
}

const SKIP = 'Skip to content';

/** What can take focus without being given a tabindex. */
const FOCUSABLE = 'a[href], button, input, select, textarea, summary, [tabindex]';

export function SkipLink({
  target,
  children = SKIP,
  className,
  onClick,
  ...rest
}: SkipLinkProps): ReactNode {
  const jump = (event: MouseEvent<HTMLAnchorElement>): void => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    // The anchor still navigates, so the address and the scroll are the
    // browser's; focus is the part it leaves behind.
    const to = event.currentTarget.ownerDocument.getElementById(target);
    if (to === null) return;
    if (!to.matches(FOCUSABLE)) to.setAttribute('tabindex', '-1');
    to.focus();
  };
  return (
    <a
      {...rest}
      href={`#${target}`}
      className={cx('rk-skip-link', className)}
      // A control, to the conformance levels (0182).
      data-rk-control=""
      onClick={jump}
    >
      {children}
    </a>
  );
}

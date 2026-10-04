'use client';

/**
 * `Link` (cairn 0135): navigation, in prose, in a status bar, in a row of pages.
 *
 * A link is text that is always underlined, so it reads as a link without its
 * colour (WCAG 1.4.1) — in greyscale, in forced colors, to a reader who cannot
 * tell the accent from the body text. Every state is drawn on top of that
 * underline from the state vocabulary (0118), and none of them adds a cell:
 *
 *   - hover is bold, because the underline is already taken (0209)
 *   - focus is the ring in `focus.css`, an outline that costs no cell
 *   - pressed is reverse video: the link's own colour becomes the ground
 *   - current (`aria-current`) is bold, in `fg.default`, with the cursor mark
 *   - disabled dims
 *
 * The cursor mark hangs in the cell *before* the link. That cell belongs to
 * the layout, which leaves it blank in every state — a word space in prose, a
 * gap in a row of links — so the mark replaces a space, the way a terminal
 * would draw it, and nothing after the link moves when it becomes current.
 *
 * A link that opens a new tab says so twice: a mark after the label for the
 * eye, and "(opens in a new tab)" for the ear. Both are there only when it
 * does. Both marks are the theme's (`useGlyphs()`), and both are `aria-hidden`.
 *
 * Behaviour is React Aria's: it writes `data-hovered`, `data-pressed`,
 * `data-focus-visible`, `data-current` and `data-disabled`, renders a disabled
 * link as a `span` with `role="link"`, and hands navigation to a
 * `RouterProvider` when there is one.
 *
 * Client-side routing (cairn 0168): wrap the app in `RouterProvider`, from
 * here, with the router's `navigate` (and `useHref`, for a base path):
 *
 *   import { Link, RouterProvider } from '@rockaway/react';
 *   const navigate = useNavigate();
 *   <RouterProvider navigate={navigate} useHref={useHref}>…</RouterProvider>
 *
 * Every Link inside then navigates through the router, and a modified click
 * (a new tab, a download) is still the browser's.
 */
import type { CSSProperties, ReactNode } from 'react';
import {
  Link as AriaLink,
  type LinkProps as AriaLinkProps,
  VisuallyHidden,
} from 'react-aria-components';

/**
 * React Aria's `RouterProvider`, the one Link reads. It is re-exported, rather
 * than left to be imported from `react-aria-components`, because it only works
 * as the same module instance Link was built against: an app with its own
 * copy of `react-aria-components` (or, under pnpm, none it can import) would
 * provide a router no Link can see.
 */
export { RouterProvider } from 'react-aria-components';

import { cx } from '../cx.ts';
import { useGlyphs } from '../glyphs.tsx';

export interface LinkProps extends Omit<AriaLinkProps, 'children' | 'className' | 'style'> {
  readonly children?: ReactNode;
  /**
   * What a reader hears after the label when the link opens a new tab
   * (`target="_blank"`). Said only then, never otherwise.
   */
  readonly newTabLabel?: string;
  readonly className?: string;
  readonly style?: CSSProperties;
}

const NEW_TAB = '(opens in a new tab)';

export function Link({
  children,
  newTabLabel = NEW_TAB,
  className,
  ...aria
}: LinkProps): ReactNode {
  const { mark } = useGlyphs();
  const newTab = aria.target === '_blank';
  return (
    <AriaLink {...aria} className={cx('rk-link', className)}>
      {({ isCurrent }) => (
        <>
          {/* The cell before the link, which the cursor mark borrows. */}
          <span aria-hidden="true" className="rk-link-cursor">
            {isCurrent ? mark.cursor : ''}
          </span>
          {children}
          {newTab ? (
            <>
              <span aria-hidden="true" className="rk-link-external">
                {mark.external}
              </span>
              {/* A span: a link is inline, and a div in a paragraph ends it. */}
              <VisuallyHidden elementType="span">{` ${newTabLabel}`}</VisuallyHidden>
            </>
          ) : null}
        </>
      )}
    </AriaLink>
  );
}

/** The states a link draws, as React Aria reports them. */
export interface LinkState {
  readonly hovered?: boolean;
  readonly focusVisible?: boolean;
  readonly pressed?: boolean;
  readonly current?: boolean;
  readonly disabled?: boolean;
  /** Opens a new tab, so it carries the external mark after the label. */
  readonly newTab?: boolean;
}

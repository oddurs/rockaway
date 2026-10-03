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
 */
import { Attr, Buffer, drawText, type Style, stringWidth } from '@rockaway/grid';
import type { Glyphs } from '@rockaway/tokens';
import type { CSSProperties, ReactNode } from 'react';
import {
  Link as AriaLink,
  type LinkProps as AriaLinkProps,
  VisuallyHidden,
} from 'react-aria-components';
import { cx } from '../cx.ts';
import { defaultGlyphs, useGlyphs } from '../glyphs.tsx';

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
              <VisuallyHidden>{` ${newTabLabel}`}</VisuallyHidden>
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

/** The label's style in a state: what the stylesheet draws, as cell attributes. */
export function linkStyle(state: LinkState): Style {
  let attrs = Attr.underline;
  if (state.current || state.hovered) attrs |= Attr.bold;
  if (state.pressed) attrs |= Attr.reverse;
  if (state.disabled) attrs |= Attr.dim;
  const fg = state.disabled ? 'fg.disabled' : state.current ? 'fg.default' : 'fg.accent';
  return { fg, attrs };
}

/**
 * A link as cells: the pure description the text snapshot tests. The first
 * cell is the one before the link, which the layout owns and the cursor mark
 * borrows; then the label; then the external mark when it opens a new tab.
 * The width depends on the label and on `newTab`, and on no state at all.
 */
export function linkBuffer(
  label: string,
  state: LinkState,
  glyphs: Glyphs = defaultGlyphs,
): Buffer {
  const width = 1 + stringWidth(label) + (state.newTab ? 1 : 0);
  const style = linkStyle(state);
  // Neither mark is underlined: the underline belongs to the words. The
  // external mark is inside the link, so it reverses with it when pressed; the
  // cursor mark is in the cell before, outside the link's ground, and keeps
  // only its weight.
  const external: Style = { ...style, attrs: style.attrs & ~Attr.underline };
  const cursor: Style = { ...style, attrs: style.attrs & Attr.bold };
  return Buffer.create({ width, height: 1 }).draw((draft) => {
    if (state.current) drawText(draft, { x: 0, y: 0 }, glyphs.mark.cursor, { style: cursor });
    const end = 1 + drawText(draft, { x: 1, y: 0 }, label, { style });
    if (state.newTab) drawText(draft, { x: end, y: 0 }, glyphs.mark.external, { style: external });
  });
}

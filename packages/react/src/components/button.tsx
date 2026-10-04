'use client';

/**
 * `Button` (cairn 0033): the first control, and the conventions the rest follow.
 *
 * A TUI button is delimited text — `[ Publish ]` — and it inverts when you
 * press it, the way a terminal has always shown a key going down. So:
 *
 *   - the delimiters are chrome: `aria-hidden`, never part of the name
 *   - pressing reverses the video, which needs no colour at all
 *   - hover underlines, disabled dims, focus is the ring in `focus.css`
 *   - danger carries the theme's `!` as well as its colour (0118)
 *
 * One row, always. Inside the delimiters the label has a cell of air on each
 * side, and the first of them is the button's mark cell: blank, or `!` for
 * danger. The air belongs to the delimiters, so a button drawn without them
 * (`delimiters="none"`, for a toolbar) is the bare label, and no variant or
 * state changes how many cells a button takes (cairn 0131).
 *
 * Behaviour is React Aria's. It supplies `data-hovered`, `data-pressed`,
 * `data-focus-visible` and `data-disabled`, and the CSS reads nothing else:
 * there is no state in here that is not in the DOM.
 */
import { type ReactNode, useEffect, useRef } from 'react';
import { Button as AriaButton, type ButtonProps as AriaButtonProps } from 'react-aria-components';
import { cx } from '../cx.ts';
import { useGlyphs } from '../glyphs.tsx';
import { usePlatform } from '../platform.ts';
import type { VariantProps, VariantValue } from '../variants.ts';
import { buttonVariants, chromeOf } from './button.pure.ts';
import { keyShortcut } from './key-hint.pure.ts';
import { KeyHint, type Platform } from './key-hint.tsx';

export type ButtonVariant = VariantValue<typeof buttonVariants, 'variant'>;

export interface ButtonProps
  extends VariantProps<typeof buttonVariants>,
    Omit<AriaButtonProps, 'children' | 'className' | 'style'> {
  readonly children?: ReactNode;
  /**
   * `fill` is the primary: reverse video, which survives forced colors and
   * greyscale because it is not a hue. `danger` is the destructive one, and
   * carries the theme's `!` in its mark cell as well as its colour.
   */
  readonly variant?: ButtonVariant;
  /**
   * The delimiters around the label: the theme's control delimiters unless
   * given. Chrome, so they are hidden from the accessible name. `none` for a
   * bare label in a toolbar, which drops the cell of air either side with
   * them. A `danger` button keeps its delimiters whatever this says, because
   * its mark has to have a cell to sit in.
   */
  readonly delimiters?: readonly [string, string] | 'none';
  /**
   * The chord that fires it: `mod+s`. It draws the hint beside the label and
   * announces the shortcut, which is how a TUI teaches itself (cairn 0099).
   */
  readonly keys?: string;
  readonly platform?: Platform | 'auto';
  readonly className?: string;
  readonly style?: React.CSSProperties;
}

export interface ButtonTextOptions extends Pick<ButtonProps, 'variant' | 'delimiters' | 'keys'> {
  readonly platform?: Platform;
}

export function Button({
  children,
  variant,
  delimiters,
  keys,
  platform = 'auto',
  className,
  ...aria
}: ButtonProps): ReactNode {
  // React Aria filters the DOM props it forwards down to the labelling set, so
  // `aria-keyshortcuts` never reaches the element through props. It is the right
  // attribute for a chord, so it goes on afterwards, by hand.
  const host = useRef<HTMLButtonElement>(null);
  // One keyboard for what is drawn and what is announced, so a Mac shows ⌘S and
  // is told Meta+s, never Control+s (cairn 0132).
  const keyboard = usePlatform(platform);
  const shortcut = keys === undefined ? undefined : keyShortcut(keys, keyboard);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    if (shortcut === undefined) el.removeAttribute('aria-keyshortcuts');
    else el.setAttribute('aria-keyshortcuts', shortcut);
  }, [shortcut]);
  const chosen = buttonVariants.select({ variant });
  const glyphs = useGlyphs();
  const chrome = chromeOf(chosen.variant, delimiters, glyphs);

  return (
    <AriaButton
      {...aria}
      ref={host}
      className={cx('rk-button', className)}
      {...buttonVariants.dataAttributes(chosen)}
    >
      {chrome === undefined ? null : (
        <>
          <span aria-hidden="true" className="rk-button-end">
            {chrome.open}
          </span>
          {/* The mark cell: blank, or the theme's `!` for danger. */}
          <span aria-hidden="true" className="rk-button-mark">
            {chrome.mark}
          </span>
        </>
      )}
      <span className="rk-button-label">
        {children}
        {keys === undefined ? null : (
          <>
            {' '}
            <KeyHint keys={keys} platform={keyboard} decorative />
          </>
        )}
      </span>
      {chrome === undefined ? null : (
        <span aria-hidden="true" className="rk-button-end">
          {`${chrome.air}${chrome.close}`}
        </span>
      )}
    </AriaButton>
  );
}

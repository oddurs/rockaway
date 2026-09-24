/**
 * `Button` (cairn 0033): the first control, and the conventions the rest follow.
 *
 * A TUI button is delimited text — `[ Publish ]` — and it inverts when you
 * press it, the way a terminal has always shown a key going down. So:
 *
 *   - the delimiters are chrome: `aria-hidden`, never part of the name
 *   - pressing reverses the video, which needs no colour at all
 *   - hover underlines, disabled dims, focus is the ring in `focus.css`
 *
 * Behaviour is React Aria's. It supplies `data-hovered`, `data-pressed`,
 * `data-focus-visible` and `data-disabled`, and the CSS reads nothing else:
 * there is no state in here that is not in the DOM.
 */
import { type ReactNode, useEffect, useRef } from 'react';
import { Button as AriaButton, type ButtonProps as AriaButtonProps } from 'react-aria-components';
import { cx } from '../cx.ts';
import { KeyHint, keyShortcut, type Platform } from './key-hint.tsx';

export type ButtonVariant = 'default' | 'fill' | 'quiet' | 'danger';
export type ButtonSize = 'md' | 'lg';

export interface ButtonProps extends Omit<AriaButtonProps, 'children' | 'className' | 'style'> {
  readonly children?: ReactNode;
  /**
   * `fill` is the primary: reverse video, which survives forced colors and
   * greyscale because it is not a hue. `danger` is the destructive one, and
   * carries a mark as well as a colour.
   */
  readonly variant?: ButtonVariant;
  /** `md` is one row; `lg` is three, with a border drawn around the label. */
  readonly size?: ButtonSize;
  /**
   * The delimiters around the label. Chrome, so they are hidden from the
   * accessible name. `none` for a bare label in a toolbar.
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

const DEFAULT_DELIMITERS: readonly [string, string] = ['[', ']'];

/** The shortcut has to be resolved for the server too, so `auto` is `other`. */
function resolve(platform: Platform | 'auto'): Platform {
  return platform === 'auto' ? 'other' : platform;
}

export function Button({
  children,
  variant = 'default',
  size = 'md',
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
  const shortcut = keys === undefined ? undefined : keyShortcut(keys, resolve(platform));
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    if (shortcut === undefined) el.removeAttribute('aria-keyshortcuts');
    else el.setAttribute('aria-keyshortcuts', shortcut);
  }, [shortcut]);
  const ends =
    delimiters === 'none'
      ? undefined
      : (delimiters ?? (variant === 'quiet' ? undefined : DEFAULT_DELIMITERS));

  return (
    <AriaButton
      {...aria}
      ref={host}
      className={cx('rk-button', className)}
      data-variant={variant}
      data-size={size}
    >
      {ends === undefined ? null : (
        <span aria-hidden="true" className="rk-button-end">
          {ends[0]}
        </span>
      )}
      <span className="rk-button-label">
        {children}
        {keys === undefined ? null : (
          <>
            {' '}
            <KeyHint keys={keys} platform={platform} decorative />
          </>
        )}
      </span>
      {ends === undefined ? null : (
        <span aria-hidden="true" className="rk-button-end">
          {ends[1]}
        </span>
      )}
    </AriaButton>
  );
}

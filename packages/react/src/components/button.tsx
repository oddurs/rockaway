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
import type { ReactNode } from 'react';
import { Button as AriaButton, type ButtonProps as AriaButtonProps } from 'react-aria-components';
import { cx } from '../cx.ts';

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
  readonly className?: string;
  readonly style?: React.CSSProperties;
}

const DEFAULT_DELIMITERS: readonly [string, string] = ['[', ']'];

export function Button({
  children,
  variant = 'default',
  size = 'md',
  delimiters,
  className,
  ...aria
}: ButtonProps): ReactNode {
  const ends =
    delimiters === 'none'
      ? undefined
      : (delimiters ?? (variant === 'quiet' ? undefined : DEFAULT_DELIMITERS));

  return (
    <AriaButton
      {...aria}
      className={cx('rk-button', className)}
      data-variant={variant}
      data-size={size}
    >
      {ends === undefined ? null : (
        <span aria-hidden="true" className="rk-button-end">
          {ends[0]}
        </span>
      )}
      <span className="rk-button-label">{children}</span>
      {ends === undefined ? null : (
        <span aria-hidden="true" className="rk-button-end">
          {ends[1]}
        </span>
      )}
    </AriaButton>
  );
}

'use client';

/**
 * `Tooltip` (cairn 0043): a one-line hint on hover or keyboard focus, what an
 * icon-only control does, or the whole of a truncated label. Never the only
 * place something is said: a reader on a touch screen never sees it.
 *
 * Built on the overlay contract (0128), through `OverlayTooltip`: React
 * Aria's `Tooltip`, on whole cells of its trigger's screen, on the row next
 * to the trigger with no gap. Its words fit on one row, and it is that row in
 * reverse video; or they wrap, and it is framed heavy, as a popover is. Either
 * way it is at most 40 cells wide.
 *
 * Put it in React Aria's `TooltipTrigger` beside the element it describes.
 * React Aria shows it on hover after a delay and at once on keyboard focus,
 * links it to the trigger by `aria-describedby`, hides it on Escape, and
 * never moves focus. Nothing here handles a key.
 */
import type { ReactNode } from 'react';
import { cx } from '../cx.ts';
import { OverlayTooltip, type OverlayTooltipProps } from './overlay.tsx';

export interface TooltipProps extends Omit<OverlayTooltipProps, 'children' | 'className'> {
  /** The hint: a few words, wrapping at 36 cells. */
  readonly children?: ReactNode;
  readonly className?: string;
}

export function Tooltip({ children, className, ...props }: TooltipProps): ReactNode {
  return (
    <OverlayTooltip {...props} className={cx('rk-tooltip', className)}>
      {children}
    </OverlayTooltip>
  );
}

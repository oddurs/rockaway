'use client';

/**
 * `Popover` (cairn 0034): a framed box anchored to a trigger, for content
 * that belongs to it: a filter form, a colour picker, help for a field. The
 * base that Menu, Select, Tooltip and Combobox sit in.
 *
 * It is the overlay contract's popover (0128) with a popover's promises
 * made: React Aria's `Popover` places it, moves focus in and back, and
 * dismisses it on Escape and on a press outside; the contract puts it on
 * the cell grid of its trigger's screen, framed heavy, carrying the
 * trigger's contexts across the portal. What Popover adds:
 *
 *   - **Never narrower than its trigger**, in whole cells, by default, so a
 *     Select's list is at least as wide as the Select. `minCols` changes it.
 *   - **Only cells.** React Aria's props in pixels (`offset`, `crossOffset`,
 *     `containerPadding`, `maxHeight`) are not offered: a popover sits on the
 *     next row with no gap, and is as tall as `maxRows` allows.
 *
 * React Aria makes the popover a `dialog` unless a Dialog is nested in it,
 * and writes `data-placement` and `data-trigger` on it.
 */
import type { ReactNode } from 'react';
import { cx } from '../cx.ts';
import { OverlayPopover, type OverlayPopoverProps } from './overlay.tsx';

export interface PopoverProps
  extends Omit<
    OverlayPopoverProps,
    'crossOffset' | 'containerPadding' | 'maxHeight' | 'arrowBoundaryOffset' | 'arrowSize'
  > {
  /**
   * The fewest cells across the popover takes, its frame included:
   * `'trigger'` for its trigger's width, rounded up to whole cells, or a
   * count. `0` lets it be as narrow as what it holds.
   */
  readonly minCols?: number | 'trigger';
}

export function Popover({
  minCols = 'trigger',
  className,
  children,
  ...overlay
}: PopoverProps): ReactNode {
  return (
    <OverlayPopover
      {...overlay}
      className={cx('rk-popover', minCols === 'trigger' && 'rk-popover-trigger-width', className)}
    >
      {children}
    </OverlayPopover>
  );
}

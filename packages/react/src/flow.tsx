'use client';

/**
 * Flow and seams: the grid's rhythm tier in React (cairn 0311, 0312, 0314).
 *
 * A `Flow` lays blocks down the page with a rhythm gap between them, counted
 * in half-steps, and is itself a seam: its outer box closes up to whole rows,
 * so what follows it stays on the grid however its inside is spaced. Where the
 * browser can round an auto height (`calc-size`, in Chromium today) the seam is
 * CSS alone; elsewhere `useSeam` sets a min-height once the block has laid out.
 */
import type { Comfort } from '@rockaway/grid';
import {
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  type RefObject,
  useLayoutEffect,
  useRef,
} from 'react';
import { measureCell } from './cell-metrics.ts';
import { cx } from './cx.ts';

/** Whether this engine closes a seam in CSS, with no script. */
function cssSeams(): boolean {
  return (
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports('block-size', 'calc-size(auto, size)')
  );
}

/**
 * Close a block's outer box to whole rows where CSS cannot (0314). The height
 * is read from the block's own content — the first child's top to the last
 * child's bottom, plus the block's padding — rather than from the block, so
 * setting the min-height can never feed back into what is measured.
 */
export function useSeam(ref: RefObject<HTMLElement | null>): void {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || cssSeams() || typeof ResizeObserver === 'undefined') return;
    let frame = 0;
    const close = (): void => {
      const first = el.firstElementChild;
      const last = el.lastElementChild;
      const style = getComputedStyle(el);
      const padding = Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom);
      const content =
        first && last ? last.getBoundingClientRect().bottom - first.getBoundingClientRect().top : 0;
      const row = measureCell(el).height;
      const rows = Math.ceil((content + padding) / row - 1 / 64);
      el.style.minBlockSize = `${rows * row}px`;
    };
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(close);
    });
    for (const child of el.children) observer.observe(child);
    close();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      el.style.minBlockSize = '';
    };
  }, [ref]);
}

export interface FlowProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  readonly children?: ReactNode;
  /**
   * The space between blocks: `gap` (the comfort's gap, the default),
   * `section` (the comfort's gap between groups), or a count of half-steps.
   */
  readonly gap?: 'gap' | 'section' | number;
  /** The comfort for this region and everything in it (0313). Inherited when absent. */
  readonly comfort?: Comfort;
}

/** Blocks down the page on rhythm half-steps, closed to whole rows at the bottom (0312). */
export function Flow({
  children,
  gap = 'gap',
  comfort,
  className,
  style,
  ...rest
}: FlowProps): ReactNode {
  const ref = useRef<HTMLDivElement>(null);
  useSeam(ref);
  const between =
    gap === 'gap'
      ? undefined
      : gap === 'section'
        ? 'var(--rk-rhythm-section)'
        : String(Math.round(gap));
  return (
    <div
      ref={ref}
      {...rest}
      className={cx('rk-flow', 'rk-seam', className)}
      data-rk-rhythm=""
      {...(comfort === undefined ? {} : { 'data-rk-comfort': comfort })}
      style={
        {
          ...(between === undefined ? {} : { '--rk-flow-gap': between }),
          ...style,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}

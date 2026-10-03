'use client';

import type { CSSProperties, ReactNode } from 'react';
import { cx } from '../cx.ts';
import { useGlyphs } from '../glyphs.tsx';
import type { VariantProps, VariantValue } from '../variants.ts';
import { badgeVariants, markOf } from './badge.pure.ts';

export type BadgeTone = VariantValue<typeof badgeVariants, 'tone'>;

export interface BadgeProps extends VariantProps<typeof badgeVariants> {
  readonly children?: ReactNode;
  /** What the badge is saying. The colour and the mark only repeat it. */
  readonly tone?: BadgeTone;
  /**
   * Draw the tone's mark before the words. `false` draws the delimiters
   * instead, and then the words alone must say the tone.
   */
  readonly mark?: boolean;
  readonly className?: string;
  readonly style?: CSSProperties;
}

export function Badge({ children, tone, mark = true, className, style }: BadgeProps): ReactNode {
  const glyphs = useGlyphs();
  const chosen = badgeVariants.select({ tone });
  const drawn = markOf(chosen.tone, mark);
  const [open, close] = glyphs.delimiter.control;
  return (
    <span
      className={cx('rk-badge', className)}
      {...badgeVariants.dataAttributes(chosen)}
      {...(style === undefined ? {} : { style })}
    >
      {drawn === undefined ? (
        <span aria-hidden="true" className="rk-badge-end">
          {open}
        </span>
      ) : (
        // The mark and the cell of air after it are one hidden run, so the
        // words are the only thing a reader hears.
        <span aria-hidden="true" className="rk-badge-mark">{`${glyphs.mark[drawn]} `}</span>
      )}
      {children}
      {drawn === undefined ? (
        <span aria-hidden="true" className="rk-badge-end">
          {close}
        </span>
      ) : null}
    </span>
  );
}

export interface BadgeOptions {
  readonly tone?: BadgeTone;
  readonly mark?: boolean;
}

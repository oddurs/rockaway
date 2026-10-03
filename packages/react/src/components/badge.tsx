'use client';

/**
 * `Badge` (cairn 0139): a short status label. `✓ passing`, `✗ failing`, `[beta]`.
 *
 * A tone is a colour, and a colour alone is lost to greyscale, to forced colors
 * and to a reader who cannot tell green from red. So every tone but neutral
 * carries the theme's mark as well, one the state vocabulary (0118) already
 * gives a meaning to:
 *
 *   neutral  [beta]       the delimiters, and no tone to state
 *   accent   ● 3 new      the filled dot: something to look at
 *   success  ✓ passing    the check
 *   warning  ! degraded   the caution mark
 *   danger   ✗ failing    the cross, which 0118 gives invalid: a failure
 *
 * Danger takes `✗` rather than the `!` 0118 gives a danger variant, because a
 * badge reports an outcome, not a destructive action: a failing check is
 * 0118's invalid row. That leaves `!` for warning, which has no row of its own.
 *
 * The mark is `aria-hidden`, so the words carry the tone to a reader: the text
 * is "failing", not only `✗`. A badge with `mark={false}` draws the delimiters
 * instead, and its words have to say the tone on their own.
 *
 * Not interactive: no role, no focus, nothing for React Aria to do. It is text
 * on a tinted ground, one row tall, every cell of it a cell of text.
 */
import { Buffer, drawText, type Style, stringWidth } from '@rockaway/grid';
import type { Glyphs, MarkName } from '@rockaway/tokens';
import type { CSSProperties, ReactNode } from 'react';
import { cx } from '../cx.ts';
import { defaultGlyphs, useGlyphs } from '../glyphs.tsx';
import {
  defineVariants,
  type VariantProps,
  type Variants,
  type VariantValue,
} from '../variants.ts';
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

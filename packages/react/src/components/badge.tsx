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

const VARIANTS = {
  tone: ['neutral', 'accent', 'success', 'warning', 'danger'],
} as const;

/** Badge's variants, as data: the props, the attributes and the metadata all read this. */
export const badgeVariants: Variants<typeof VARIANTS> = defineVariants(VARIANTS, {
  tone: 'neutral',
});

export type BadgeTone = VariantValue<typeof badgeVariants, 'tone'>;

/** The mark each tone draws before its words. Neutral has none: it is delimited. */
const TONE_MARK: Readonly<Record<BadgeTone, MarkName | undefined>> = {
  neutral: undefined,
  accent: 'radio',
  success: 'check',
  warning: 'danger',
  danger: 'cross',
};

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

/** What a badge draws: its tone's mark, or delimiters when it has none or is told not to. */
function markOf(tone: BadgeTone, mark: boolean): MarkName | undefined {
  return mark ? TONE_MARK[tone] : undefined;
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

/** The style of a badge's words in a tone: the colour tokens the stylesheet uses. */
export function badgeStyle(tone: BadgeTone): Style {
  const name = tone === 'neutral' ? 'muted' : tone;
  const ground = tone === 'neutral' ? 'bg.subtle' : `bg.${tone}.subtle`;
  return { fg: `fg.${name}`, bg: ground, attrs: 0 };
}

/**
 * A badge as cells: the pure description the text snapshot tests. One row, as
 * wide as its words plus two cells, whichever form it takes: the mark and its
 * cell of air, or the two delimiters.
 */
export function badgeBuffer(
  text: string,
  options: BadgeOptions = {},
  glyphs: Glyphs = defaultGlyphs,
): Buffer {
  const { tone } = badgeVariants.select({ tone: options.tone });
  const drawn = markOf(tone, options.mark ?? true);
  const words = badgeStyle(tone);
  const edge: Style = {
    ...words,
    fg: tone === 'neutral' ? 'border.control' : `border.${tone}`,
  };
  const [open, close] = glyphs.delimiter.control;
  const lead = drawn === undefined ? open : `${glyphs.mark[drawn]} `;
  const tail = drawn === undefined ? close : '';
  const width = stringWidth(lead) + stringWidth(text) + stringWidth(tail);
  return Buffer.create({ width, height: 1 }).draw((draft) => {
    let x = drawText(draft, { x: 0, y: 0 }, lead, { style: drawn === undefined ? edge : words });
    x += drawText(draft, { x, y: 0 }, text, { style: words });
    drawText(draft, { x, y: 0 }, tail, { style: edge });
  });
}

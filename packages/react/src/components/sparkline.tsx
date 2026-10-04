'use client';

/**
 * `Sparkline` (cairn 0101): a series at a glance, newest at the right, in
 * braille dots or the theme's bars, drawn by the cell (0166). A reader hears
 * the series in words.
 */
import type { CSSProperties, ReactNode } from 'react';
import { cx } from '../cx.ts';
import { useGlyphs } from '../glyphs.tsx';
import type { StrokeStyle } from '../paint/cells.ts';
import { Runs } from '../paint/runs.tsx';
import { type SparklineKind, sparklineBuffer, sparklineSummary } from './progress.pure.ts';

export type { SparklineKind } from './progress.pure.ts';

export interface SparklineProps {
  /** The series, oldest first. The newest that fit are drawn, at the right. */
  readonly values: readonly number[];
  /** What the series is, for the text a reader hears in its place: `Load, 1 minute`. */
  readonly label: string;
  /** Its width in cells: two values a cell in braille, one in bars. */
  readonly cols?: number;
  /** Its height in rows: four levels a row in braille, eight in bars. */
  readonly rows?: number;
  /** The value at the bottom: the series' lowest, or 0 if that is lower. */
  readonly min?: number;
  /** The value at the top: the series' highest. */
  readonly max?: number;
  /**
   * `braille`, two values a cell in dots, or `bars`, one a cell in eighths.
   * An ASCII theme has no braille, and draws bars.
   */
  readonly kind?: SparklineKind;
  /**
   * How the cell draws its strokes: \`glyph\`, weighted like the type, or
   * \`rule\`, hairlines. Blocks and dots look the same in both; it is here so
   * a bar matches the screen it sits in.
   */
  readonly painter?: StrokeStyle;
  readonly className?: string;
  readonly style?: CSSProperties;
}

/**
 * A series at a glance: an image whose text is the series in words (how many
 * values, first and last, lowest and highest), drawn in cells.
 */
export function Sparkline({
  values,
  label,
  cols = 16,
  rows = 1,
  min,
  max,
  kind = 'braille',
  painter = 'glyph',
  className,
  style,
}: SparklineProps): ReactNode {
  const glyphs = useGlyphs();
  const buffer = sparklineBuffer(
    {
      values,
      cols,
      rows,
      kind,
      ...(min === undefined ? {} : { min }),
      ...(max === undefined ? {} : { max }),
    },
    glyphs,
  );
  return (
    <span
      role="img"
      aria-label={sparklineSummary(label, values)}
      className={cx('rk-sparkline', className)}
      data-rk-painted={painter}
      {...(style === undefined ? {} : { style })}
    >
      {Array.from({ length: buffer.height }, (_, y) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: a row is its place.
        <span key={y} className="rk-row" aria-hidden="true">
          <Runs buffer={buffer} y={y} />
        </span>
      ))}
    </span>
  );
}

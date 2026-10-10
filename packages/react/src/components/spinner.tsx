'use client';

/**
 * `Spinner` (cairn 0101): something happening, in one cell. The theme's
 * spinner frames on the spinner tick, braille drawn by the cell (0166), or
 * `| / - \\` under an ASCII theme; held at its first frame under reduced
 * motion. A `status`, so its label is announced and its frame never is.
 */
import type { CSSProperties, ReactNode } from 'react';
import { cx } from '../cx.ts';
import { useGlyphs } from '../glyphs.tsx';
import { type StrokeStyle, shapeAttributes } from '../paint/cells.ts';
import { useTick } from '../tick.ts';
import { spinnerFrame } from './progress.pure.ts';

export interface SpinnerProps {
  /** What is happening, shown after the frame and announced: `Indexing`. */
  readonly label: string;
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
 * Something happening, with no amount to show: the theme's spinner frame on
 * the spinner tick, then a cell and the label. A `status`, so the label is
 * announced; the frame never is.
 */
export function Spinner({ label, painter = 'glyph', className, style }: SpinnerProps): ReactNode {
  const glyphs = useGlyphs();
  const frame = spinnerFrame(useTick('spinner', glyphs.spinner.length), glyphs);
  return (
    <span
      role="status"
      className={cx('rk-spinner', className)}
      {...(style === undefined ? {} : { style })}
    >
      {/* A painted layer of one cell, so it is drawn and checked as any other. */}
      <span className="rk-spinner-frame" aria-hidden="true" data-rk-painted={painter}>
        <span className="rk-row">
          <span className="rk-run" {...shapeAttributes(frame)}>
            {frame}
          </span>
        </span>
      </span>
      <span className="rk-spinner-label">{` ${label}`}</span>
    </span>
  );
}

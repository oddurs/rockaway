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
import { shapeAttributes } from '../paint/cells.ts';
import { useTick } from '../tick.ts';
import { spinnerFrame } from './progress.pure.ts';

export interface SpinnerProps {
  /** What is happening, shown after the frame and announced: `Indexing`. */
  readonly label: string;
  readonly className?: string;
  readonly style?: CSSProperties;
}

/**
 * Something happening, with no amount to show: the theme's spinner frame on
 * the spinner tick, then a cell and the label. A `status`, so the label is
 * announced; the frame never is.
 */
export function Spinner({ label, className, style }: SpinnerProps): ReactNode {
  const glyphs = useGlyphs();
  const frame = spinnerFrame(useTick('spinner', glyphs.spinner.length), glyphs);
  return (
    <span
      role="status"
      className={cx('rk-spinner', className)}
      data-rk-painted="glyph"
      {...(style === undefined ? {} : { style })}
    >
      <span className="rk-spinner-frame rk-run" aria-hidden="true" {...shapeAttributes(frame)}>
        {frame}
      </span>
      <span className="rk-spinner-label">{` ${label}`}</span>
    </span>
  );
}

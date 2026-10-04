'use client';

/**
 * `ProgressBar` (cairn 0101): how far along a task is, as one row of cells.
 *
 * The bar's whole cells are full blocks and its leading edge is one of the
 * theme's eight fills, so it grows in eighths of a cell, drawn by the cell
 * (0117) as one solid run at every density. With no amount to show it is
 * indeterminate: the medium shade across, and on the progress tick a block
 * crossing it. Under reduced motion only the shade, which reads as busy
 * without a position anyone could mistake for an amount.
 */
import type { CSSProperties, ReactNode } from 'react';
import { ProgressBar as AriaProgressBar, Label } from 'react-aria-components';
import { cx } from '../cx.ts';
import { useGlyphs } from '../glyphs.tsx';
import { Part } from '../paint/runs.tsx';
import { useTick } from '../tick.ts';
import { barCells, fractionOf, indeterminateCells, percentText } from './progress.pure.ts';

/** An indeterminate bar: the only part of a progress bar that ticks. */
function Busy({ cols }: { readonly cols: number }): ReactNode {
  const glyphs = useGlyphs();
  const frame = useTick('progress');
  const { before, block, after } = indeterminateCells(frame, cols, glyphs);
  // At rest, and under reduced motion, the whole bar is the shade: busy.
  if (block === '') return <Part className="rk-progress-busy" text={before} />;
  return (
    <>
      <Part className="rk-progress-track" text={before} />
      <Part className="rk-progress-fill" text={block} />
      <Part className="rk-progress-track" text={after} />
    </>
  );
}

export interface ProgressBarProps {
  /** How far along, from `minValue` to `maxValue`. Leave it out, or set `isIndeterminate`, when nobody knows. */
  readonly value?: number;
  readonly minValue?: number;
  readonly maxValue?: number;
  /** Busy with no amount: the bar is shaded across, and a block crosses it on the progress tick. */
  readonly isIndeterminate?: boolean;
  /** The words before the bar, and its accessible name. */
  readonly label?: string;
  /** The accessible name, when there are no words to show. */
  readonly 'aria-label'?: string;
  /** The bar's width in cells, not counting the label or the value. */
  readonly cols?: number;
  readonly className?: string;
  readonly style?: CSSProperties;
}

/**
 * A task's progress, as one row: the label, a cell, the bar, a cell and the
 * percentage, which takes four cells whatever it says.
 */
export function ProgressBar({
  value,
  minValue = 0,
  maxValue = 100,
  isIndeterminate,
  label,
  'aria-label': ariaLabel,
  cols = 20,
  className,
  style,
}: ProgressBarProps): ReactNode {
  const glyphs = useGlyphs();
  const busy = isIndeterminate === true || value === undefined;
  const fraction = busy ? 0 : fractionOf(value, minValue, maxValue);
  const { fill, track } = barCells(fraction, cols, glyphs);
  return (
    <AriaProgressBar
      className={cx('rk-progress', className)}
      {...(value === undefined ? {} : { value })}
      minValue={minValue}
      maxValue={maxValue}
      isIndeterminate={busy}
      {...(ariaLabel === undefined ? {} : { 'aria-label': ariaLabel })}
      {...(style === undefined ? {} : { style })}
    >
      {label === undefined ? null : (
        <>
          <Label className="rk-progress-label" elementType="span">
            {label}
          </Label>{' '}
        </>
      )}
      <span className="rk-progress-bar" aria-hidden="true" data-rk-painted="glyph">
        {busy ? (
          <Busy cols={cols} />
        ) : (
          <>
            <Part className="rk-progress-fill" text={fill} />
            <Part className="rk-progress-track" text={track} />
          </>
        )}
      </span>
      <span className="rk-progress-value" aria-hidden="true">
        {` ${busy ? glyphs.mark.blank.repeat(4) : percentText(fraction)}`}
      </span>
    </AriaProgressBar>
  );
}

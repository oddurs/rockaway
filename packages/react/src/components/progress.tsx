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
import type { StrokeStyle } from '../paint/cells.ts';
import { PaintedRow } from '../paint/runs.tsx';
import { useTick } from '../tick.ts';
import { barCells, fractionOf, indeterminateCells, percentText } from './progress.pure.ts';

/** An indeterminate bar: the only part of a progress bar that ticks. */
function Busy({
  cols,
  painter,
}: {
  readonly cols: number;
  readonly painter: StrokeStyle;
}): ReactNode {
  const glyphs = useGlyphs();
  const frame = useTick('progress');
  const { before, block, after } = indeterminateCells(frame, cols, glyphs);
  // At rest, and under reduced motion, the whole bar is the shade: busy.
  const segments =
    block === ''
      ? [{ text: before, className: 'rk-progress-busy' }]
      : [
          { text: before, className: 'rk-progress-track' },
          { text: block, className: 'rk-progress-fill' },
          { text: after, className: 'rk-progress-track' },
        ];
  return <PaintedRow className="rk-progress-bar" painter={painter} segments={segments} />;
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
  painter = 'glyph',
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
      {busy ? (
        <Busy cols={cols} painter={painter} />
      ) : (
        <PaintedRow
          className="rk-progress-bar"
          painter={painter}
          segments={[
            { text: fill, className: 'rk-progress-fill' },
            { text: track, className: 'rk-progress-track' },
          ]}
        />
      )}
      <span className="rk-progress-value" aria-hidden="true">
        {` ${busy ? glyphs.mark.blank.repeat(4) : percentText(fraction)}`}
      </span>
    </AriaProgressBar>
  );
}

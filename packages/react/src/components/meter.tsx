'use client';

/**
 * `Meter` (cairn 0101): a level against its thresholds, as one row of cells.
 * ProgressBar's bar, for a level that goes up and down, with a mark cell that
 * carries its tone without colour.
 */
import type { CSSProperties, JSX, ReactElement, ReactNode } from 'react';
import { Meter as AriaMeter, Label } from 'react-aria-components';
import { cx } from '../cx.ts';
import { useGlyphs } from '../glyphs.tsx';
import type { StrokeStyle } from '../paint/cells.ts';
import { PaintedRow } from '../paint/runs.tsx';
import type { VariantProps, VariantValue } from '../variants.ts';
import {
  barCells,
  fractionOf,
  type MeterTone,
  meterMark,
  meterTone,
  meterVariants,
  percentText,
} from './progress.pure.ts';

export type { MeterTone } from './progress.pure.ts';

/**
 * `meter` alone. React Aria writes `meter progressbar`, the fallback for
 * readers that predate `meter`; axe reads that list as no role it knows, and
 * refuses the value attributes on it. Every reader we support knows meter.
 */
function asMeter(props: JSX.IntrinsicElements['div']): ReactElement {
  // biome-ignore lint/a11y/useSemanticElements: a <meter> draws its own bar, and this bar is cells.
  // biome-ignore lint/a11y/useAriaPropsForRole: React Aria's props carry aria-valuenow.
  return <div {...props} role="meter" />;
}

export type MeterToneName = VariantValue<typeof meterVariants, 'tone'>;

export interface MeterProps extends VariantProps<typeof meterVariants> {
  /** The level, from `minValue` to `maxValue`. */
  readonly value: number;
  readonly minValue?: number;
  readonly maxValue?: number;
  /**
   * At or past this the meter is a warning: its fill is fg.warning and its
   * mark cell draws the theme's `!`. In the meter's own units.
   */
  readonly warning?: number;
  /**
   * At or past this the meter is in danger: fg.danger and the theme's `✗`.
   * Give it below `warning` for a meter where low is bad, like a battery.
   */
  readonly danger?: number;
  /** The tone outright, in place of the thresholds: `neutral` draws no mark. */
  readonly tone?: MeterToneName;
  /** The words before the bar, and its accessible name. */
  readonly label?: string;
  readonly 'aria-label'?: string;
  /**
   * What the value reads as, after the bar, and what a reader hears:
   * `11.2/16G`. A percentage unless given. Keep it one width as the value
   * changes, or the meter's width will change with it.
   */
  readonly valueLabel?: string;
  /** The bar's width in cells. */
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
 * A level, as one row: the label, the bar, a mark cell that carries the tone
 * without colour, and the value. A line of its own, so meters stack.
 */
export function Meter({
  value,
  minValue = 0,
  maxValue = 100,
  warning,
  danger,
  tone: given,
  label,
  'aria-label': ariaLabel,
  valueLabel,
  cols = 20,
  painter = 'glyph',
  className,
  style,
}: MeterProps): ReactNode {
  const glyphs = useGlyphs();
  const fraction = fractionOf(value, minValue, maxValue);
  const { fill, track } = barCells(fraction, cols, glyphs);
  const worked: MeterTone | undefined = meterTone(value, {
    ...(warning === undefined ? {} : { warning }),
    ...(danger === undefined ? {} : { danger }),
  });
  const chosen = meterVariants.select({ tone: given ?? worked });
  const tone = chosen.tone === 'neutral' ? undefined : chosen.tone;
  return (
    <AriaMeter
      className={cx('rk-meter', className)}
      render={asMeter}
      value={value}
      minValue={minValue}
      maxValue={maxValue}
      {...(valueLabel === undefined ? {} : { valueLabel })}
      {...(ariaLabel === undefined ? {} : { 'aria-label': ariaLabel })}
      {...meterVariants.dataAttributes(chosen)}
      {...(style === undefined ? {} : { style })}
    >
      {label === undefined ? null : (
        <>
          <Label className="rk-progress-label" elementType="span">
            {label}
          </Label>{' '}
        </>
      )}
      <PaintedRow
        className="rk-progress-bar"
        painter={painter}
        segments={[
          { text: fill, className: 'rk-progress-fill' },
          { text: track, className: 'rk-progress-track' },
        ]}
      />
      <span className="rk-meter-mark" aria-hidden="true">
        {meterMark(tone, glyphs)}
      </span>
      <span className="rk-progress-value" aria-hidden="true">
        {valueLabel ?? percentText(fraction)}
      </span>
    </AriaMeter>
  );
}

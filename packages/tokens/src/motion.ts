/**
 * Motion (cairn 0075, 0120): frames on a tick.
 *
 * A terminal does not tween. Something that moves steps through frames — the
 * braille spinner, a blinking cursor, a block crossing an indeterminate bar —
 * one whole frame at a time, on a fixed interval. So the tokens are the
 * intervals: there are no durations to ease between, and no curves.
 *
 * Under reduced motion the frames stop and the first frame stays. Nothing
 * fades and nothing slides, so there is nothing else to collapse.
 */
import type { Group } from './dtcg.ts';

export const tickNames = ['spinner', 'blink', 'progress'] as const;
export type TickName = (typeof tickNames)[number];

/** Milliseconds per frame. */
export const ticks: Readonly<Record<TickName, number>> = {
  /** The braille spinner: ten frames, a revolution in under a second. */
  spinner: 80,
  /** A cursor or an attention mark, on and off. */
  blink: 500,
  /** An indeterminate bar: one cell along per frame. */
  progress: 100,
};

export function motion(): Group {
  return {
    motion: {
      tick: {
        $type: 'duration',
        $description:
          'Frames on a tick (cairn 0120): how long each frame of a stepped animation holds. Under reduced motion the frames stop and the first frame stays.',
        ...Object.fromEntries(
          tickNames.map((name) => [name, { $value: { value: ticks[name], unit: 'ms' } }]),
        ),
      },
    },
  };
}

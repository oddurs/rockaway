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
 *
 * One tick is not motion: `refresh`, how often live data is read again. A
 * reader who asked for less motion asked for the spinner to stop turning, not
 * for the numbers to stop being true, so under reduced motion it keeps
 * counting, at the slower rate in `reducedTicks`. Pausing it is the app's to
 * offer (WCAG 2.2.2), not the motion setting's.
 */
import type { Group } from './dtcg.ts';

export const tickNames = ['spinner', 'blink', 'progress', 'refresh'] as const;
export type TickName = (typeof tickNames)[number];

/** Milliseconds per frame. */
export const ticks: Readonly<Record<TickName, number>> = {
  /** The braille spinner: ten frames, a revolution in under a second. */
  spinner: 80,
  /** A cursor or an attention mark, on and off. */
  blink: 500,
  /** An indeterminate bar: one cell along per frame. */
  progress: 100,
  /** Live data, read again: a monitor's numbers, a log's tail. Not motion. */
  refresh: 1000,
};

/**
 * The ticks that keep counting under reduced motion, and how often they do.
 * Every tick not named here stops on its first frame.
 */
export const reducedTicks: Readonly<Partial<Record<TickName, number>>> = {
  /** Still current, at a pace that does not read as movement. */
  refresh: 5000,
};

export function motion(): Group {
  return {
    motion: {
      tick: {
        $type: 'duration',
        $description:
          'Frames on a tick (cairn 0120): how long each frame of a stepped animation holds. Under reduced motion the frames stop and the first frame stays, except refresh, which is data rather than motion and slows to tick-reduced.',
        ...Object.fromEntries(
          tickNames.map((name) => [name, { $value: { value: ticks[name], unit: 'ms' } }]),
        ),
      },
      'tick-reduced': {
        $type: 'duration',
        $description:
          'The ticks that keep counting under reduced motion, at this interval: live data stays current while nothing animates.',
        ...Object.fromEntries(
          Object.entries(reducedTicks).map(([name, ms]) => [
            name,
            { $value: { value: ms, unit: 'ms' } },
          ]),
        ),
      },
    },
  };
}

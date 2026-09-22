/**
 * Motion. Short, and decelerating on the way in. Reduced motion is handled in
 * the base CSS, which collapses durations, not here.
 */
import type { Group } from './dtcg.ts';

export const durations = { fast: 120, base: 200, slow: 320 } as const;

export const easings = {
  standard: [0.2, 0, 0, 1],
  enter: [0, 0, 0, 1],
  exit: [0.3, 0, 1, 1],
} as const;

export function motion(): Group {
  return {
    motion: {
      duration: {
        $type: 'duration',
        ...Object.fromEntries(
          Object.entries(durations).map(([k, v]) => [k, { $value: { value: v, unit: 'ms' } }]),
        ),
      },
      easing: {
        $type: 'cubicBezier',
        ...Object.fromEntries(Object.entries(easings).map(([k, v]) => [k, { $value: v }])),
      },
    },
  };
}

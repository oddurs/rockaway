/**
 * The layout solver (cairn 0081).
 *
 * Three panes in eighty columns is 26.67 each, and somebody has to decide who
 * gets the extra cell. Largest remainder decides, ties going left, so the
 * answer is the same every time and a resize moves one boundary rather than
 * shuffling the row.
 */
import { type Rect, rect } from './geometry.ts';

export type Track =
  | { readonly kind: 'fixed'; readonly cells: number }
  | {
      readonly kind: 'grow';
      readonly weight?: number;
      readonly min?: number;
      readonly max?: number;
    };

export const fixed = (cells: number): Track => ({ kind: 'fixed', cells });
export const grow = (weight = 1, bounds: { min?: number; max?: number } = {}): Track => ({
  kind: 'grow',
  weight,
  ...bounds,
});

export interface Solution {
  /** One size per track, in cells. Always whole, always non-negative. */
  readonly sizes: readonly number[];
  /** Where each track starts, gaps included. */
  readonly offsets: readonly number[];
  /** Cells the tracks asked for beyond what there was. Zero when everything fits. */
  readonly overflow: number;
  /** Cells nobody could take, because every track hit its maximum. */
  readonly leftover: number;
}

export interface SolveOptions {
  /** Cells between tracks. */
  readonly gap?: number;
}

/** Distribute `total` among `tracks`. Every number that comes back is a whole number of cells. */
export function solve(
  total: number,
  tracks: readonly Track[],
  { gap = 0 }: SolveOptions = {},
): Solution {
  if (!Number.isInteger(total)) throw new RangeError(`space is whole cells, got ${total}`);
  if (!Number.isInteger(gap) || gap < 0) throw new RangeError(`gap is whole cells, got ${gap}`);
  if (tracks.length === 0)
    return { sizes: [], offsets: [], overflow: 0, leftover: Math.max(0, total) };

  const gaps = gap * (tracks.length - 1);
  const available = total - gaps;

  const sizes = tracks.map((track) =>
    track.kind === 'fixed' ? Math.max(0, Math.trunc(track.cells)) : 0,
  );
  const wanted = sizes.reduce((sum, n) => sum + n, 0);

  const growers = tracks
    .map((track, index) => ({ track, index }))
    .filter(
      (t): t is { track: Extract<Track, { kind: 'grow' }>; index: number } =>
        t.track.kind === 'grow',
    );

  // Growers start at their minimum; that is what they need before anyone grows.
  for (const { track, index } of growers) sizes[index] = Math.max(0, Math.trunc(track.min ?? 0));
  const floor = sizes.reduce((sum, n) => sum + n, 0);

  if (available < floor) {
    // Not enough room even for the minimums: say so rather than inventing space.
    return { sizes, offsets: offsetsOf(sizes, gap), overflow: floor - available, leftover: 0 };
  }

  let spare = available - floor;
  let active = growers.filter(({ track, index }) => {
    const max = track.max ?? Number.POSITIVE_INFINITY;
    return (sizes[index] as number) < max && (track.weight ?? 1) > 0;
  });

  // Largest remainder, re-run whenever a maximum takes a track out of the pool.
  while (spare > 0 && active.length > 0) {
    const weight = active.reduce((sum, { track }) => sum + (track.weight ?? 1), 0);
    const shares = active.map(({ track, index }) => {
      const exact = (spare * (track.weight ?? 1)) / weight;
      return { index, track, whole: Math.floor(exact), remainder: exact - Math.floor(exact) };
    });

    let handed = shares.reduce((sum, s) => sum + s.whole, 0);
    const order = [...shares].sort((a, b) => b.remainder - a.remainder || a.index - b.index);
    for (const share of order) {
      if (handed >= spare) break;
      share.whole += 1;
      handed += 1;
    }

    let taken = 0;
    for (const share of shares) {
      const max = share.track.max ?? Number.POSITIVE_INFINITY;
      const room = max - (sizes[share.index] as number);
      const give = Math.min(share.whole, room);
      sizes[share.index] = (sizes[share.index] as number) + give;
      taken += give;
    }

    spare -= taken;
    const before = active.length;
    active = active.filter(
      ({ track, index }) => (sizes[index] as number) < (track.max ?? Number.POSITIVE_INFINITY),
    );
    if (taken === 0 && active.length === before) break;
  }

  const used = sizes.reduce((sum, n) => sum + n, 0);
  return {
    sizes,
    offsets: offsetsOf(sizes, gap),
    overflow:
      Math.max(0, wanted + gaps - total) === 0
        ? Math.max(0, floor - available)
        : wanted + gaps - total,
    leftover: Math.max(0, available - used),
  };
}

function offsetsOf(sizes: readonly number[], gap: number): number[] {
  const offsets: number[] = [];
  let at = 0;
  for (const size of sizes) {
    offsets.push(at);
    at += size + gap;
  }
  return offsets;
}

/** Split a rect into columns. A solved box is a container for the next solve. */
export function columns(area: Rect, tracks: readonly Track[], options?: SolveOptions): Rect[] {
  const { sizes, offsets } = solve(area.width, tracks, options);
  return sizes.map((width, i) => rect(area.x + (offsets[i] as number), area.y, width, area.height));
}

/** Split a rect into rows. */
export function rows(area: Rect, tracks: readonly Track[], options?: SolveOptions): Rect[] {
  const { sizes, offsets } = solve(area.height, tracks, options);
  return sizes.map((height, i) =>
    rect(area.x, area.y + (offsets[i] as number), area.width, height),
  );
}

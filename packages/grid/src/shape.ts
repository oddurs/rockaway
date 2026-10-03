/**
 * Shapes (cairn 0116, 0117): box drawing and block elements as geometry.
 *
 * A font's `│` is as tall as the font says, not as tall as the cell, so a line
 * drawn with the font meets its neighbours at one line height, for one font.
 * The font supplies letters; the cell supplies geometry. This is the geometry:
 * every glyph the junction table can produce, and the block elements, as
 * rectangles and arcs measured from the cell's own edges and centre.
 *
 * Nothing here draws. A painter turns a shape into pixels — the CSS package
 * generates a stylesheet from these marks at build time, and a canvas painter
 * could read the same ones. The character stays in its cell, so text,
 * snapshots, and copy and paste are untouched.
 *
 * ASCII borders are not here. `+--+` is letters, and in a terminal it never
 * joins either; drawing it as lines would make it the single set.
 */
import type { Edges, Weight } from './buffer.ts';
import { arcTable, edgesFromKey, junctionTable } from './junction.ts';

export type Side = 'north' | 'east' | 'south' | 'west';

/** The parts of a length that are not a fraction of the cell. */
export interface Terms {
  /** Multiples of a light stroke's width. A double line is two light strokes. */
  readonly light?: number;
  /** Multiples of a heavy stroke's width. */
  readonly heavy?: number;
  /** Multiples of the space between a double line's two strokes. */
  readonly gap?: number;
  /**
   * Multiples of the arc radius: half the cell's shorter side, less one light
   * stroke, so a rounded corner always ends in a piece of straight stroke at
   * the cell's edge and meets its neighbour the way a straight line does.
   */
  readonly radius?: number;
}

/**
 * A length along one axis of a cell, as a sum of terms, because neither the
 * cell nor the strokes are known until something renders them.
 */
export interface Measure extends Terms {
  /** A fraction of the cell on this axis: 0 is the top or left edge, 1 the far one. */
  readonly cell: number;
}

export interface RectMark {
  readonly kind: 'rect';
  readonly x0: Measure;
  readonly y0: Measure;
  readonly x1: Measure;
  readonly y1: Measure;
  /** How much of the ink it lays down: 1 for a stroke or a block, less for a shade. */
  readonly alpha: number;
}

/**
 * A quarter of a ring, one light stroke wide and centred on `cx, cy`: the
 * corner of a rounded box. Only the part inside the box is drawn. A circle,
 * not an ellipse, so the stroke keeps its width all the way round.
 */
export interface ArcMark {
  readonly kind: 'arc';
  readonly cx: Measure;
  readonly cy: Measure;
  readonly x0: Measure;
  readonly y0: Measure;
  readonly x1: Measure;
  readonly y1: Measure;
}

export type Mark = RectMark | ArcMark;

export interface Shape {
  readonly ch: string;
  readonly kind: 'box' | 'arc' | 'block';
  /**
   * A stable name for the shape: `box-0110` is a box glyph by its weights,
   * north, east, south, west; `arc-0110` the rounded corner with those edges;
   * `block-2588` a block element by its code point.
   */
  readonly key: string;
  readonly marks: readonly Mark[];
  /** Which edges of the cell the ink touches. */
  readonly reach: Readonly<Record<Side, boolean>>;
  /**
   * Every mark runs the full width of the cell, so a run of the same shape is
   * one box with no seams in it. A painter can draw `────` as one element.
   */
  readonly spans: boolean;
}

/** Concrete sizes, to resolve a measure against. */
export interface Metrics {
  readonly width: number;
  readonly height: number;
  readonly light: number;
  readonly heavy: number;
  readonly gap: number;
}

/** A measure in pixels (or whatever unit the metrics are in), along an axis `extent` long. */
export function resolve(m: Measure, extent: number, metrics: Metrics): number {
  const radius = Math.min(metrics.width, metrics.height) / 2 - metrics.light;
  return (
    m.cell * extent +
    (m.light ?? 0) * metrics.light +
    (m.heavy ?? 0) * metrics.heavy +
    (m.gap ?? 0) * metrics.gap +
    (m.radius ?? 0) * radius
  );
}

const TERMS = ['light', 'heavy', 'gap', 'radius'] as const;

function terms(source: Readonly<Record<string, number | undefined>>): Terms {
  const out: Record<string, number> = {};
  for (const name of TERMS) {
    const value = source[name] ?? 0;
    if (value !== 0) out[name] = value;
  }
  return out;
}

function add(...parts: readonly Terms[]): Terms {
  const sum: Record<string, number> = {};
  for (const part of parts) {
    for (const name of TERMS) sum[name] = (sum[name] ?? 0) + (part[name] ?? 0);
  }
  return terms(sum);
}

function scale(t: Terms, k: number): Terms {
  return terms(Object.fromEntries(TERMS.map((name) => [name, (t[name] ?? 0) * k])));
}

const at = (cell: number, ...parts: readonly Terms[]): Measure => ({ cell, ...add(...parts) });

const NONE: Terms = {};

// The measurements a junction is built from. A double line is two light
// strokes `gap` apart: each one sits `TRACK` from the centre line, its inner
// edge `INNER` from it and its outer edge `OUTER`.
const TRACK: Terms = { light: 0.5, gap: 0.5 };
const INNER: Terms = { gap: 0.5 };
const OUTER: Terms = { light: 1, gap: 0.5 };

/** Half the width of a single stroke of this weight. */
const half = (w: Weight): Terms => (w === 2 ? { heavy: 0.5 } : { light: 0.5 });

/** How far from the centre line a side's ink reaches, across the line. */
const extent = (w: Weight): Terms => (w === 0 ? NONE : w === 3 ? OUTER : half(w));

const OPPOSITE: Readonly<Record<Side, Side>> = {
  north: 'south',
  east: 'west',
  south: 'north',
  west: 'east',
};

// Across a side's line, the perpendicular side on the negative side (up for a
// horizontal line, left for a vertical one) and on the positive side.
const BEFORE: Readonly<Record<Side, Side>> = {
  north: 'west',
  south: 'west',
  east: 'north',
  west: 'north',
};
const AFTER: Readonly<Record<Side, Side>> = {
  north: 'east',
  south: 'east',
  east: 'south',
  west: 'south',
};

/**
 * A stroke along one side: from that edge of the cell in to `stop` (measured
 * from the centre toward the edge, so a negative stop runs past the centre),
 * `offset` across from the centre line, `width` wide.
 */
function track(side: Side, stop: Terms, offset: Terms, width: Terms): RectMark {
  const across0 = at(0.5, offset, scale(width, -0.5));
  const across1 = at(0.5, offset, scale(width, 0.5));
  switch (side) {
    case 'east':
      return rect(at(0.5, stop), across0, at(1), across1);
    case 'west':
      return rect(at(0), across0, at(0.5, scale(stop, -1)), across1);
    case 'south':
      return rect(across0, at(0.5, stop), across1, at(1));
    case 'north':
      return rect(across0, at(0), across1, at(0.5, scale(stop, -1)));
  }
}

const rect = (x0: Measure, y0: Measure, x1: Measure, y1: Measure, alpha = 1): RectMark => ({
  kind: 'rect',
  x0,
  y0,
  x1,
  y1,
  alpha,
});

/**
 * Where a single (light or heavy) stroke stops. It runs past the centre far
 * enough to cover whatever crosses it, so a corner is closed and a tee has no
 * notch. The one exception is a double line passing straight across: a stroke
 * that ends there stops at the near track, `╤`, and one that carries on
 * crosses both, `╪`.
 */
function singleStop(side: Side, e: Edges): Terms {
  const before = e[BEFORE[side]];
  const after = e[AFTER[side]];
  if (before === 3 && after === 3) {
    return e[OPPOSITE[side]] === 0 ? INNER : scale(OUTER, -1);
  }
  if (before === 0 && after === 0) return scale(half(e[side]), -1);
  // The heavier crossing reaches further, so it decides: light < heavy < double.
  return scale(extent(Math.max(before, after) as Weight), -1);
}

/**
 * Where one track of a double line stops. `near` is the perpendicular side on
 * this track's side of the line, `far` the other one.
 *
 * - near is double: the two lines turn into each other, inner track to inner
 *   track — the inside of `╔`, the four corners of `╬`.
 * - near is single: the track runs under that stroke and stops at its far edge.
 * - nothing near: the track carries straight on if the opposite side is double
 *   (`═`, the outside of `╦`), turns the outside corner if the far side is
 *   double (the outside of `╔`), or ends at a single stroke across it (`╒`).
 */
function doubleStop(side: Side, e: Edges, near: Weight, far: Weight): Terms {
  if (near === 3) return INNER;
  if (near !== 0) return scale(half(near), -1);
  if (e[OPPOSITE[side]] !== 0 || far === 3) return scale(OUTER, -1);
  if (far !== 0) return scale(half(far), -1);
  return NONE;
}

/**
 * The marks for a box-drawing glyph with these weights. Each side draws a
 * stroke from its edge in toward the centre; the neighbouring cell draws the
 * other half of the line from its own edge, so the two meet at the shared edge
 * by construction, at any cell size.
 */
export function boxMarks(e: Edges): RectMark[] {
  // A straight line through the cell is drawn edge to edge in one piece. Across,
  // that makes a run of them one box with nothing to join.
  const straight = (w: Weight, line: (from: Measure, to: Measure) => RectMark): RectMark[] => {
    if (w !== 3) return [line(at(0.5, scale(half(w), -1)), at(0.5, half(w)))];
    return [-1, 1].map((sign) => {
      const centre = scale(TRACK, sign);
      return line(at(0.5, centre, { light: -0.5 }), at(0.5, centre, { light: 0.5 }));
    });
  };
  if (e.north === 0 && e.south === 0 && e.east !== 0 && e.east === e.west) {
    return straight(e.east, (y0, y1) => rect(at(0), y0, at(1), y1));
  }
  if (e.east === 0 && e.west === 0 && e.north !== 0 && e.north === e.south) {
    return straight(e.north, (x0, x1) => rect(x0, at(0), x1, at(1)));
  }

  const marks: RectMark[] = [];
  for (const side of ['north', 'east', 'south', 'west'] as const) {
    const w = e[side];
    if (w === 0) continue;
    if (w === 3) {
      const before = e[BEFORE[side]];
      const after = e[AFTER[side]];
      marks.push(track(side, doubleStop(side, e, before, after), scale(TRACK, -1), { light: 1 }));
      marks.push(track(side, doubleStop(side, e, after, before), TRACK, { light: 1 }));
    } else {
      marks.push(track(side, singleStop(side, e), NONE, w === 2 ? { heavy: 1 } : { light: 1 }));
    }
  }
  return marks;
}

/**
 * A rounded corner: a quarter circle of the arc radius, with straight stroke
 * either side of it out to the two edges it joins. The straight parts overlap
 * the end of the arc by a whole stroke. That leaves no seam where they meet,
 * and it means the ink at the cell's edge is always a straight stroke, placed
 * exactly as its neighbour's is, even when the cell is so narrow that the arc
 * runs right up to the edge.
 */
export function arcMarks(e: Edges): Mark[] {
  const sx = e.east !== 0 ? 1 : -1;
  const sy = e.south !== 0 ? 1 : -1;
  const r: Terms = { radius: 1 };
  const edge = (sign: number) => at(sign > 0 ? 1 : 0);
  // From the end of the arc, out to the edge.
  const along = (sign: number) => at(0.5, scale(r, sign), { light: -sign });
  const across0 = at(0.5, { light: -0.5 });
  const across1 = at(0.5, { light: 0.5 });
  const ordered = (a: Measure, b: Measure, sign: number): [Measure, Measure] =>
    sign > 0 ? [a, b] : [b, a];

  const [vy0, vy1] = ordered(along(sy), edge(sy), sy);
  const [hx0, hx1] = ordered(along(sx), edge(sx), sx);
  // The quarter of the ring's bounding box that faces the cell's centre.
  const [ax0, ax1] = ordered(at(0.5, { light: -0.5 * sx }), at(0.5, scale(r, sx)), sx);
  const [ay0, ay1] = ordered(at(0.5, { light: -0.5 * sy }), at(0.5, scale(r, sy)), sy);

  return [
    rect(across0, vy0, across1, vy1),
    rect(hx0, across0, hx1, across1),
    {
      kind: 'arc',
      cx: at(0.5, scale(r, sx)),
      cy: at(0.5, scale(r, sy)),
      x0: ax0,
      y0: ay0,
      x1: ax1,
      y1: ay1,
    },
  ];
}

type Box = readonly [x0: number, y0: number, x1: number, y1: number];

const QUADRANT = {
  ul: [0, 0, 0.5, 0.5],
  ur: [0.5, 0, 1, 0.5],
  ll: [0, 0.5, 0.5, 1],
  lr: [0.5, 0.5, 1, 1],
} as const satisfies Record<string, Box>;

/** U+2580–U+259F, as fractions of the cell. */
const BLOCKS: readonly (readonly [ch: string, boxes: readonly Box[], alpha?: number])[] = [
  ['▀', [[0, 0, 1, 0.5]]],
  ...[1, 2, 3, 4, 5, 6, 7, 8].map(
    (n) => [String.fromCodePoint(0x2580 + n), [[0, 1 - n / 8, 1, 1]]] as const,
  ),
  ...[7, 6, 5, 4, 3, 2, 1].map(
    (n, i) => [String.fromCodePoint(0x2589 + i), [[0, 0, n / 8, 1]]] as const,
  ),
  ['▐', [[0.5, 0, 1, 1]]],
  ['░', [[0, 0, 1, 1]], 0.25],
  ['▒', [[0, 0, 1, 1]], 0.5],
  ['▓', [[0, 0, 1, 1]], 0.75],
  ['▔', [[0, 0, 1, 1 / 8]]],
  ['▕', [[7 / 8, 0, 1, 1]]],
  ['▖', [QUADRANT.ll]],
  ['▗', [QUADRANT.lr]],
  ['▘', [QUADRANT.ul]],
  ['▙', [QUADRANT.ul, QUADRANT.ll, QUADRANT.lr]],
  ['▚', [QUADRANT.ul, QUADRANT.lr]],
  ['▛', [QUADRANT.ul, QUADRANT.ur, QUADRANT.ll]],
  ['▜', [QUADRANT.ul, QUADRANT.ur, QUADRANT.lr]],
  ['▝', [QUADRANT.ur]],
  ['▞', [QUADRANT.ur, QUADRANT.ll]],
  ['▟', [QUADRANT.ur, QUADRANT.ll, QUADRANT.lr]],
];

/** A cell to measure against when working out which edges a shape reaches. */
const PROBE: Metrics = { width: 10, height: 20, light: 1, heavy: 2, gap: 1 };

function reachOf(marks: readonly Mark[]): Record<Side, boolean> {
  const reach = { north: false, east: false, south: false, west: false };
  const near = (a: number, b: number): boolean => Math.abs(a - b) < 1e-9;
  for (const m of marks) {
    const x0 = resolve(m.x0, PROBE.width, PROBE);
    const x1 = resolve(m.x1, PROBE.width, PROBE);
    const y0 = resolve(m.y0, PROBE.height, PROBE);
    const y1 = resolve(m.y1, PROBE.height, PROBE);
    if (x1 - x0 <= 0 || y1 - y0 <= 0) continue;
    if (near(y0, 0)) reach.north = true;
    if (near(y1, PROBE.height)) reach.south = true;
    if (near(x0, 0)) reach.west = true;
    if (near(x1, PROBE.width)) reach.east = true;
  }
  return reach;
}

const isWhole = (m: Measure, cell: number): boolean =>
  m.cell === cell && TERMS.every((name) => (m[name] ?? 0) === 0);

function shape(ch: string, kind: Shape['kind'], key: string, marks: readonly Mark[]): Shape {
  return {
    ch,
    kind,
    key,
    marks,
    reach: reachOf(marks),
    spans: marks.every((m) => m.kind === 'rect' && isWhole(m.x0, 0) && isWhole(m.x1, 1)),
  };
}

const weights = (e: Edges): string => `${e.north}${e.east}${e.south}${e.west}`;

function build(): ReadonlyMap<string, Shape> {
  const out = new Map<string, Shape>();
  for (const [key, ch] of junctionTable) {
    const e = edgesFromKey(key);
    out.set(ch, shape(ch, 'box', `box-${weights(e)}`, boxMarks(e)));
  }
  for (const [key, ch] of arcTable) {
    const e = edgesFromKey(key);
    out.set(ch, shape(ch, 'arc', `arc-${weights(e)}`, arcMarks(e)));
  }
  for (const [ch, boxes, alpha = 1] of BLOCKS) {
    const marks = boxes.map(([x0, y0, x1, y1]) => rect(at(x0), at(y0), at(x1), at(y1), alpha));
    const code = (ch.codePointAt(0) ?? 0).toString(16);
    out.set(ch, shape(ch, 'block', `block-${code}`, marks));
  }
  return out;
}

/** Every character a cell draws for itself, by character. */
export const shapes: ReadonlyMap<string, Shape> = build();

/** The shape a cell draws for this character, or undefined if the font draws it. */
export function shapeOf(ch: string): Shape | undefined {
  return shapes.get(ch);
}

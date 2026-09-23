/**
 * Junctions (cairn 0079).
 *
 * A border is not a character, it is four edge weights on a cell: none, light,
 * heavy or double, one per side. The glyph is looked up from those weights,
 * which is what makes drawing order-independent — draw a box over a line or a
 * line over a box, and the seam is the same `┬`.
 *
 * The table below is the Unicode box-drawing block, inverted: each entry is a
 * character and the weights it represents, read off U+2500–U+257F.
 */
import type { Edges, Weight } from './buffer.ts';

export type BorderSetName = 'single' | 'double' | 'heavy' | 'rounded' | 'ascii';

export interface BorderSet {
  readonly name: BorderSetName;
  /** The weight this set draws with. */
  readonly weight: Weight;
  /** Corners are arcs. */
  readonly rounded: boolean;
  /** Draw with `- | +` instead of the box-drawing block. */
  readonly ascii: boolean;
}

export const borderSets: Readonly<Record<BorderSetName, BorderSet>> = {
  single: { name: 'single', weight: 1, rounded: false, ascii: false },
  double: { name: 'double', weight: 3, rounded: false, ascii: false },
  heavy: { name: 'heavy', weight: 2, rounded: false, ascii: false },
  rounded: { name: 'rounded', weight: 1, rounded: true, ascii: false },
  ascii: { name: 'ascii', weight: 1, rounded: false, ascii: true },
};

/** north, east, south, west — two bits each, north highest. */
export function edgeKey({ north, east, south, west }: Edges): number {
  return (north << 6) | (east << 4) | (south << 2) | west;
}

export function edgesFromKey(key: number): Edges {
  return {
    north: ((key >> 6) & 3) as Weight,
    east: ((key >> 4) & 3) as Weight,
    south: ((key >> 2) & 3) as Weight,
    west: (key & 3) as Weight,
  };
}

/** The heavier of two edges wins, side by side. */
export function mergeEdges(a: Edges, b: Edges): Edges {
  return {
    north: Math.max(a.north, b.north) as Weight,
    east: Math.max(a.east, b.east) as Weight,
    south: Math.max(a.south, b.south) as Weight,
    west: Math.max(a.west, b.west) as Weight,
  };
}

type Entry = readonly [ch: string, north: Weight, east: Weight, south: Weight, west: Weight];

// U+2500–U+257F, as weights. Order follows the block.
const ENTRIES: readonly Entry[] = [
  // Lines and their ends.
  ['─', 0, 1, 0, 1],
  ['━', 0, 2, 0, 2],
  ['│', 1, 0, 1, 0],
  ['┃', 2, 0, 2, 0],
  ['╴', 0, 0, 0, 1],
  ['╵', 1, 0, 0, 0],
  ['╶', 0, 1, 0, 0],
  ['╷', 0, 0, 1, 0],
  ['╸', 0, 0, 0, 2],
  ['╹', 2, 0, 0, 0],
  ['╺', 0, 2, 0, 0],
  ['╻', 0, 0, 2, 0],
  ['╼', 0, 2, 0, 1],
  ['╽', 1, 0, 2, 0],
  ['╾', 0, 1, 0, 2],
  ['╿', 2, 0, 1, 0],
  // Corners.
  ['┌', 0, 1, 1, 0],
  ['┍', 0, 2, 1, 0],
  ['┎', 0, 1, 2, 0],
  ['┏', 0, 2, 2, 0],
  ['┐', 0, 0, 1, 1],
  ['┑', 0, 0, 1, 2],
  ['┒', 0, 0, 2, 1],
  ['┓', 0, 0, 2, 2],
  ['└', 1, 1, 0, 0],
  ['┕', 1, 2, 0, 0],
  ['┖', 2, 1, 0, 0],
  ['┗', 2, 2, 0, 0],
  ['┘', 1, 0, 0, 1],
  ['┙', 1, 0, 0, 2],
  ['┚', 2, 0, 0, 1],
  ['┛', 2, 0, 0, 2],
  // Tees: east.
  ['├', 1, 1, 1, 0],
  ['┝', 1, 2, 1, 0],
  ['┞', 2, 1, 1, 0],
  ['┟', 1, 1, 2, 0],
  ['┠', 2, 1, 2, 0],
  ['┡', 2, 2, 1, 0],
  ['┢', 1, 2, 2, 0],
  ['┣', 2, 2, 2, 0],
  // Tees: west.
  ['┤', 1, 0, 1, 1],
  ['┥', 1, 0, 1, 2],
  ['┦', 2, 0, 1, 1],
  ['┧', 1, 0, 2, 1],
  ['┨', 2, 0, 2, 1],
  ['┩', 2, 0, 1, 2],
  ['┪', 1, 0, 2, 2],
  ['┫', 2, 0, 2, 2],
  // Tees: south.
  ['┬', 0, 1, 1, 1],
  ['┭', 0, 1, 1, 2],
  ['┮', 0, 2, 1, 1],
  ['┯', 0, 2, 1, 2],
  ['┰', 0, 1, 2, 1],
  ['┱', 0, 1, 2, 2],
  ['┲', 0, 2, 2, 1],
  ['┳', 0, 2, 2, 2],
  // Tees: north.
  ['┴', 1, 1, 0, 1],
  ['┵', 1, 1, 0, 2],
  ['┶', 1, 2, 0, 1],
  ['┷', 1, 2, 0, 2],
  ['┸', 2, 1, 0, 1],
  ['┹', 2, 1, 0, 2],
  ['┺', 2, 2, 0, 1],
  ['┻', 2, 2, 0, 2],
  // Crosses.
  ['┼', 1, 1, 1, 1],
  ['┽', 1, 1, 1, 2],
  ['┾', 1, 2, 1, 1],
  ['┿', 1, 2, 1, 2],
  ['╀', 2, 1, 1, 1],
  ['╁', 1, 1, 2, 1],
  ['╂', 2, 1, 2, 1],
  ['╃', 2, 1, 1, 2],
  ['╄', 2, 2, 1, 1],
  ['╅', 1, 1, 2, 2],
  ['╆', 1, 2, 2, 1],
  ['╇', 2, 2, 1, 2],
  ['╈', 1, 2, 2, 2],
  ['╉', 2, 1, 2, 2],
  ['╊', 2, 2, 2, 1],
  ['╋', 2, 2, 2, 2],
  // Doubles, and the mixes with light that Unicode actually has.
  ['═', 0, 3, 0, 3],
  ['║', 3, 0, 3, 0],
  ['╒', 0, 3, 1, 0],
  ['╓', 0, 1, 3, 0],
  ['╔', 0, 3, 3, 0],
  ['╕', 0, 0, 1, 3],
  ['╖', 0, 0, 3, 1],
  ['╗', 0, 0, 3, 3],
  ['╘', 1, 3, 0, 0],
  ['╙', 3, 1, 0, 0],
  ['╚', 3, 3, 0, 0],
  ['╛', 1, 0, 0, 3],
  ['╜', 3, 0, 0, 1],
  ['╝', 3, 0, 0, 3],
  ['╞', 1, 3, 1, 0],
  ['╟', 3, 1, 3, 0],
  ['╠', 3, 3, 3, 0],
  ['╡', 1, 0, 1, 3],
  ['╢', 3, 0, 3, 1],
  ['╣', 3, 0, 3, 3],
  ['╤', 0, 3, 1, 3],
  ['╥', 0, 1, 3, 1],
  ['╦', 0, 3, 3, 3],
  ['╧', 1, 3, 0, 3],
  ['╨', 3, 1, 0, 1],
  ['╩', 3, 3, 0, 3],
  ['╪', 1, 3, 1, 3],
  ['╫', 3, 1, 3, 1],
  ['╬', 3, 3, 3, 3],
];

/** Arcs replace the four light corners when the set is rounded. */
const ARCS: readonly Entry[] = [
  ['╭', 0, 1, 1, 0],
  ['╮', 0, 0, 1, 1],
  ['╯', 1, 0, 0, 1],
  ['╰', 1, 1, 0, 0],
];

function index(entries: readonly Entry[]): ReadonlyMap<number, string> {
  const map = new Map<number, string>();
  for (const [ch, north, east, south, west] of entries) {
    map.set(edgeKey({ north, east, south, west }), ch);
  }
  return map;
}

const GLYPHS = index(ENTRIES);
const ARC_GLYPHS = index(ARCS);

/** What the table holds, for tests and for documentation. */
export const junctionTable: ReadonlyMap<number, string> = GLYPHS;

function demote(edges: Edges, from: Weight, to: Weight): Edges {
  const step = (w: Weight): Weight => (w === from ? to : w);
  return {
    north: step(edges.north),
    east: step(edges.east),
    south: step(edges.south),
    west: step(edges.west),
  };
}

/**
 * The glyph for a cell's edges, or undefined if nothing is drawn there.
 *
 * Unicode has every combination of light and heavy, and only some of the
 * combinations involving double: there is no double-and-heavy corner. Rather
 * than draw nothing, a mix that does not exist is drawn one weight down —
 * double becomes heavy, then heavy becomes light — which is visible, correct
 * in shape, and documented rather than surprising.
 */
export function glyphFor(edges: Edges, set: BorderSet = borderSets.single): string | undefined {
  const key = edgeKey(edges);
  if (key === 0) return undefined;

  if (set.ascii) {
    const horizontal = edges.east !== 0 || edges.west !== 0;
    const vertical = edges.north !== 0 || edges.south !== 0;
    if (horizontal && vertical) return '+';
    return horizontal ? '-' : '|';
  }

  if (set.rounded) {
    const arc = ARC_GLYPHS.get(key);
    if (arc) return arc;
  }

  const exact = GLYPHS.get(key);
  if (exact) return exact;

  const asHeavy = GLYPHS.get(edgeKey(demote(edges, 3, 2)));
  if (asHeavy) return asHeavy;

  return GLYPHS.get(edgeKey(demote(demote(edges, 3, 1), 2, 1)));
}

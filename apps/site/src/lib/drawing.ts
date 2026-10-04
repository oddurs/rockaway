/**
 * The landing page's live drawing (cairn 0108): boxes on a grid, joined by
 * the junction table.
 *
 * Nothing in it stores a corner. Every box is edges on cells, and every
 * character is looked up from the edges a cell has when the drawing is done,
 * so a box drawn over another meets it in the right tee or cross, whichever
 * was drawn first, in any weight. A reader draws more with the pointer or
 * the keys, and the engine joins those too.
 *
 * Pure: a size and a state in, a buffer out. The server draws the first
 * frame with it, and the page's script draws every frame after.
 */
import {
  Attr,
  type BorderSet,
  type BorderSetName,
  Buffer,
  borderSets,
  drawBox,
  drawLabel,
  type Point,
  type Rect,
  rect,
  type Size,
} from '@rockaway/grid';

export type Weight = 'light' | 'heavy' | 'double';

export interface Box extends Rect {
  readonly weight: Weight;
  readonly title?: string;
}

export interface DrawingState {
  /** The reader's boxes, oldest first, after the ones the page starts with. */
  readonly boxes: readonly Box[];
  /** Where the keyboard's cursor is, when the drawing has focus. */
  readonly cursor?: Point;
  /** Where a box being drawn started. */
  readonly anchor?: Point;
  /** What the next box is drawn in. */
  readonly weight: Weight;
}

/**
 * The size the server draws at: what a phone forty cells wide has room for
 * inside the page's pane. The script widens it to the room it really has.
 */
export const SERVER_SIZE: Size = { width: 34, height: 14 };

/** As tall as it is on every screen: what changes is how wide. */
export const ROWS = 14;

const SETS: Readonly<Record<Weight, BorderSetName>> = {
  light: 'single',
  heavy: 'heavy',
  double: 'double',
};

const setOf = (weight: Weight): BorderSet => borderSets[SETS[weight]];

/** The box between two corners, either way round, at least two cells each way. */
export function boxBetween(a: Point, b: Point, weight: Weight): Box {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return {
    ...rect(x, y, Math.max(2, Math.abs(a.x - b.x) + 1), Math.max(2, Math.abs(a.y - b.y) + 1)),
    weight,
  };
}

/**
 * The boxes the page starts with, fitted to the width: a screen split into
 * panes, and two boxes laid over the splits in the other weights, so every
 * kind of junction is on it before anyone draws.
 */
export function startingBoxes({ width, height }: Size): Box[] {
  const split = Math.max(12, Math.floor(width * 0.42));
  const middle = Math.floor(height / 2);
  return [
    {
      ...rect(0, 0, width, height),
      weight: 'light',
      // The title stops at the split's tee: the long one only where it fits.
      title: split - 3 >= 'drawn by the engine'.length ? 'drawn by the engine' : 'live',
    },
    { ...rect(0, 0, split + 1, height), weight: 'light' },
    { ...rect(split, 0, width - split, middle + 1), weight: 'light' },
    // Across the split, its title clear of the crossing.
    { ...rect(split - 9, middle - 3, 14, 6), weight: 'heavy', title: 'heavy' },
    // Across the right pane's rule, by its sides: a double line crossing a
    // single one is a glyph of its own, `╫`.
    { ...rect(width - 13, middle - 1, 11, 4), weight: 'double', title: 'double' },
  ];
}

/** The weights, as a label set into the bottom edge of the right pane: on one row, or not at all. */
function weightsLabel(room: number): string | undefined {
  const long = '1 light  2 heavy  3 double';
  if (room >= long.length + 4) return long;
  const short = '1 2 3 weight';
  return room >= short.length + 4 ? short : undefined;
}

/** The drawing at a size: the starting boxes, the reader's, and the one being drawn. */
export function drawing(size: Size, state: DrawingState): Buffer {
  const { width, height } = size;
  const split = Math.max(12, Math.floor(width * 0.42));
  return Buffer.create(size).draw((draft) => {
    // The only words are labels set into edges: a box drawn across one takes
    // the cells it needs and the label gives them back, so nothing a reader
    // draws can land on text (0175).
    const weights = weightsLabel(width - split);
    if (weights) {
      drawLabel(draft, rect(split, height - 1, width - split, 1), weights, {
        set: setOf('light'),
        align: 'end',
        style: { fg: 'fg.muted', attrs: Attr.none },
      });
    }
    for (const box of [...startingBoxes(size), ...state.boxes]) {
      drawBox(draft, box, {
        set: setOf(box.weight),
        ...(box.title ? { title: box.title, titleStyle: { attrs: Attr.bold } } : {}),
      });
    }
    if (state.anchor && state.cursor) {
      drawBox(draft, boxBetween(state.anchor, state.cursor, state.weight), {
        set: setOf(state.weight),
        style: { fg: 'fg.accent', attrs: Attr.none },
      });
    }
    if (state.cursor) {
      const cell = draft.at(state.cursor);
      if (cell) draft.set(state.cursor, { ...cell, style: { ...cell.style, attrs: Attr.reverse } });
    }
  });
}

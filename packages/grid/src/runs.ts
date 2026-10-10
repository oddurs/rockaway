/**
 * Box drawing in text (cairn 0116, 0138).
 *
 * Text that is not painted by a screen, code in a block or a diagram in
 * prose, still puts its box drawing and blocks on the grid the same way: each
 * such character is a cell box the renderer strokes, the character kept,
 * transparent, so a copy is exact. This is the one split that decides which
 * characters those are, for a component and for a build step alike.
 */
import { shapeOf } from './shape.ts';
import { stringWidth } from './text.ts';

/** A piece of text: plain, or one shaped character in a run of them. */
export interface ShapeRun {
  readonly text: string;
  /** The shape the cell draws, when the characters are box drawing or blocks. */
  readonly shape?: string;
  /** How many cells the run covers. */
  readonly cells: number;
}

/**
 * Split text into plain runs and runs of characters the cell draws. A line
 * across the cell joins its neighbour, so a run of `─` is one box; any other
 * shape is a cell of its own. Joined, the runs are the text.
 */
export function shapeRuns(text: string): ShapeRun[] {
  const out: ShapeRun[] = [];
  let plain = '';
  const chars = [...text];
  for (let i = 0; i < chars.length; ) {
    const ch = chars[i] as string;
    const shape = shapeOf(ch);
    if (shape === undefined) {
      plain += ch;
      i += 1;
      continue;
    }
    if (plain !== '') out.push({ text: plain, cells: stringWidth(plain) });
    plain = '';
    let count = 1;
    while (shape.spans && chars[i + count] === ch) count += 1;
    out.push({ text: ch.repeat(count), shape: shape.key, cells: count });
    i += count;
  }
  if (plain !== '') out.push({ text: plain, cells: stringWidth(plain) });
  return out;
}

/**
 * The text painter (cairn 0083): a buffer as the characters it is.
 *
 * This is the format snapshots use, so a failing test prints the screen rather
 * than a diff of objects. It is also what "copy as text" gives a reader.
 */
import { BLANK, Buffer, type Cell } from '../buffer.ts';
import { graphemes } from '../text.ts';

export interface ToTextOptions {
  /** Drop trailing spaces on each line, so diffs stay readable. Default true. */
  readonly trimEnd?: boolean;
}

export function toText(buffer: Buffer, { trimEnd = true }: ToTextOptions = {}): string {
  const lines: string[] = [];
  for (let y = 0; y < buffer.height; y++) {
    const row = buffer.row(y);
    lines.push(trimEnd ? row.replace(/ +$/, '') : row);
  }
  return lines.join('\n');
}

/**
 * Text back into a buffer: the inverse of `toText`, so a screen can be written
 * in a test as the thing it should look like.
 */
export function fromText(text: string): Buffer {
  const lines = text.split('\n');
  const width = lines.reduce((max, line) => Math.max(max, widthOf(line)), 0);
  const buffer = Buffer.create({ width, height: lines.length });
  return buffer.draw((draft) => {
    lines.forEach((line, y) => {
      let x = 0;
      for (const cluster of graphemes(line)) {
        const cell = cellFor(cluster);
        draft.set({ x, y }, cell);
        if (cell.width === 2) draft.set({ x: x + 1, y }, { ch: '', style: cell.style, width: 0 });
        x += cell.width === 0 ? 0 : cell.width;
      }
    });
  });
}

function widthOf(line: string): number {
  let width = 0;
  for (const cluster of graphemes(line)) width += cellFor(cluster).width;
  return width;
}

function cellFor(cluster: string): Cell {
  if (cluster === ' ') return BLANK;
  const width = cluster.codePointAt(0) === undefined ? 1 : undefined;
  return { ch: cluster, style: BLANK.style, width: width ?? widthOfCluster(cluster) };
}

function widthOfCluster(cluster: string): 0 | 1 | 2 {
  // Kept local so the painter does not reach across for one number.
  const code = cluster.codePointAt(0) ?? 0;
  const wide =
    (code >= 0x1100 && code <= 0x115f) ||
    (code >= 0x2e80 && code <= 0xa4cf) ||
    (code >= 0xac00 && code <= 0xd7a3) ||
    (code >= 0xf900 && code <= 0xfaff) ||
    (code >= 0xfe30 && code <= 0xfe6f) ||
    (code >= 0xff00 && code <= 0xff60) ||
    (code >= 0xffe0 && code <= 0xffe6) ||
    (code >= 0x1f000 && code <= 0x1fbff) ||
    (code >= 0x20000 && code <= 0x3fffd);
  return wide ? 2 : 1;
}

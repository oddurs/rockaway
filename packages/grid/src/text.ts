/**
 * Text in cells (cairn 0080).
 *
 * A character is not a cell. Han takes two, a combining accent takes none,
 * and a family emoji is one grapheme made of seven code points. Everything
 * that lays text out asks these functions, so the answer is the same
 * everywhere.
 */

/** Ranges that occupy two cells: East Asian Wide and Fullwidth, and the emoji blocks. */
const WIDE: readonly (readonly [number, number])[] = [
  [0x1100, 0x115f],
  [0x2329, 0x232a],
  [0x2e80, 0x303e],
  [0x3041, 0x33ff],
  [0x3400, 0x4dbf],
  [0x4e00, 0x9fff],
  [0xa000, 0xa4cf],
  [0xa960, 0xa97f],
  [0xac00, 0xd7a3],
  [0xf900, 0xfaff],
  [0xfe10, 0xfe19],
  [0xfe30, 0xfe6f],
  [0xff00, 0xff60],
  [0xffe0, 0xffe6],
  [0x1f004, 0x1f004],
  [0x1f0cf, 0x1f0cf],
  [0x1f18e, 0x1f18e],
  [0x1f191, 0x1f19a],
  [0x1f1e6, 0x1f1ff],
  [0x1f200, 0x1f320],
  [0x1f32d, 0x1f335],
  [0x1f337, 0x1f37c],
  [0x1f37e, 0x1f393],
  [0x1f3a0, 0x1f3ca],
  [0x1f3cf, 0x1f3d3],
  [0x1f3e0, 0x1f3f0],
  [0x1f3f4, 0x1f3f4],
  [0x1f3f8, 0x1f43e],
  [0x1f440, 0x1f440],
  [0x1f442, 0x1f4fc],
  [0x1f4ff, 0x1f53d],
  [0x1f54b, 0x1f54e],
  [0x1f550, 0x1f567],
  [0x1f57a, 0x1f57a],
  [0x1f595, 0x1f596],
  [0x1f5a4, 0x1f5a4],
  [0x1f5fb, 0x1f64f],
  [0x1f680, 0x1f6c5],
  [0x1f6cc, 0x1f6cc],
  [0x1f6d0, 0x1f6d2],
  [0x1f6eb, 0x1f6ec],
  [0x1f6f4, 0x1f6fc],
  [0x1f7e0, 0x1f7eb],
  [0x1f90c, 0x1f93a],
  [0x1f93c, 0x1f945],
  [0x1f947, 0x1f9ff],
  [0x1fa70, 0x1faff],
  [0x20000, 0x2fffd],
  [0x30000, 0x3fffd],
];

const ZERO_WIDTH = /^[\p{Mn}\p{Me}\p{Cf}]$/u;

function inRanges(code: number, ranges: readonly (readonly [number, number])[]): boolean {
  let lo = 0;
  let hi = ranges.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const [start, end] = ranges[mid] as readonly [number, number];
    if (code < start) hi = mid - 1;
    else if (code > end) lo = mid + 1;
    else return true;
  }
  return false;
}

/**
 * How many cells one code point takes: 2 for wide and fullwidth, 0 for
 * combining marks, format characters and control characters, 1 otherwise.
 *
 * Tabs are 0 here on purpose: a tab has no width of its own, and text is
 * expanded (`expandTabs`) before it reaches a buffer.
 */
export function charWidth(char: string): 0 | 1 | 2 {
  const code = char.codePointAt(0);
  if (code === undefined) return 0;
  if (code < 0x20 || (code >= 0x7f && code < 0xa0)) return 0;
  if (ZERO_WIDTH.test(char)) return 0;
  return inRanges(code, WIDE) ? 2 : 1;
}

const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });

/** The user-perceived characters of a string: what a cursor moves over. */
export function graphemes(text: string): string[] {
  return [...segmenter.segment(text)].map((s) => s.segment);
}

/** The width of one grapheme cluster: its widest code point, and never zero unless every part is. */
export function clusterWidth(cluster: string): 0 | 1 | 2 {
  let width: 0 | 1 | 2 = 0;
  for (const char of cluster) {
    const w = charWidth(char);
    if (w > width) width = w;
  }
  return width;
}

/** How many cells a string takes. */
export function stringWidth(text: string): number {
  let total = 0;
  for (const cluster of graphemes(text)) total += clusterWidth(cluster);
  return total;
}

/** Replace tabs with spaces to the next stop, so text has a width at all. */
export function expandTabs(text: string, tabSize = 2): string {
  let out = '';
  let column = 0;
  for (const cluster of graphemes(text)) {
    if (cluster === '\t') {
      const spaces = tabSize - (column % tabSize);
      out += ' '.repeat(spaces);
      column += spaces;
    } else {
      out += cluster;
      column += clusterWidth(cluster);
    }
  }
  return out;
}

/** The first `width` cells of a string, never splitting a cluster or a wide character. */
export function sliceWidth(text: string, width: number): string {
  if (width <= 0) return '';
  let out = '';
  let used = 0;
  for (const cluster of graphemes(text)) {
    const w = clusterWidth(cluster);
    if (used + w > width) break;
    out += cluster;
    used += w;
  }
  return out;
}

/**
 * Shorten to pad, with the ellipsis inside the budget. A string that already
 * fits is returned unchanged, and a budget too small for the ellipsis gives
 * back as many cells as there are.
 */
export function truncate(text: string, width: number, ellipsis = '…'): string {
  if (width <= 0) return '';
  if (stringWidth(text) <= width) return text;
  const mark = stringWidth(ellipsis) <= width ? ellipsis : '';
  return sliceWidth(text, width - stringWidth(mark)) + mark;
}

/**
 * Break into lines that pad. Breaks on spaces where it can and inside a word
 * where it must. No line is wider than the budget, with one exception that
 * has no answer: a single grapheme wider than the whole line — a Han
 * character in a one-cell column — goes on a line of its own.
 */
export function wrap(text: string, width: number): string[] {
  if (width <= 0) return [];
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    const started = lines.length;
    let line = '';
    let lineWidth = 0;

    const push = (): void => {
      lines.push(line);
      line = '';
      lineWidth = 0;
    };

    for (const word of paragraph.split(' ')) {
      const wordWidth = stringWidth(word);
      const needed = lineWidth === 0 ? wordWidth : wordWidth + 1;

      if (lineWidth > 0 && lineWidth + needed > width) push();

      if (wordWidth <= width) {
        line += (lineWidth === 0 ? '' : ' ') + word;
        lineWidth += lineWidth === 0 ? wordWidth : wordWidth + 1;
        continue;
      }

      // A word longer than the line: break it where it has to break.
      let rest = word;
      while (rest !== '') {
        const room = width - lineWidth - (lineWidth === 0 ? 0 : 1);
        const piece = sliceWidth(rest, room);
        if (piece === '') {
          if (lineWidth > 0) {
            push();
            continue;
          }
          // One cluster wider than the whole line: it goes on a line of its
          // own and overflows, because there is nowhere else for it to go.
          const [first = ''] = graphemes(rest);
          lines.push(first);
          rest = rest.slice(first.length);
          continue;
        }
        line += (lineWidth === 0 ? '' : ' ') + piece;
        lineWidth += stringWidth(piece) + (lineWidth === 0 ? 0 : 1);
        rest = rest.slice(piece.length);
        if (rest !== '') push();
      }
    }
    // An empty paragraph is still a line; an empty remainder is not.
    if (line !== '' || lines.length === started) lines.push(line);
  }
  return lines;
}

/** Pad to exactly `width` cells, truncating what does not fit. */
export function pad(
  text: string,
  width: number,
  align: 'start' | 'center' | 'end' = 'start',
): string {
  const shortened = truncate(text, width);
  const spare = width - stringWidth(shortened);
  if (spare <= 0) return shortened;
  if (align === 'start') return shortened + ' '.repeat(spare);
  if (align === 'end') return ' '.repeat(spare) + shortened;
  const left = Math.floor(spare / 2);
  return ' '.repeat(left) + shortened + ' '.repeat(spare - left);
}

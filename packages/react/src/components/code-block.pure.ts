/**
 * `CodeBlock`: the pure half (cairn 0126).
 *
 * The block's chrome, its layout and its text, and a snapshot set in its
 * frame. No React and no client boundary, so a server, a static renderer or a
 * test can call them; `code-block.tsx` imports them from here.
 */
import {
  Attr,
  addEdges,
  type BorderSetName,
  Buffer,
  borderSets,
  type Draft,
  drawBox,
  drawLabel,
  drawText,
  fromText,
  rect,
  type Size,
  type Style,
  stringWidth,
} from '@rockaway/grid';
import { type Glyphs, marks, type SyntaxRole, themeGlyphs } from '@rockaway/tokens';
import { drawRule } from './divider.pure.ts';

/** One highlighted token: its text, and the role a highlighter gave it. */
export interface CodeToken {
  readonly text: string;
  readonly role?: SyntaxRole;
}

/** A line of tokens. A block's lines joined with newlines are its code. */
export type CodeLine = readonly CodeToken[];

const LINE: Style = { fg: 'border.default', attrs: Attr.none };
const TITLE: Style = { fg: 'fg.default', attrs: Attr.none };
const NUMBER: Style = { fg: 'fg.muted', attrs: Attr.none };

/**
 * The copy button says `Copy`, and `Done` for a moment after: the same four
 * cells, so the state is in the word and nothing moves.
 */
export const COPY_LABEL: string = 'Copy';
export const DONE_LABEL: string = 'Done';
/** Its delimiters, a cell of air either side, and the word. */
export const COPY_CELLS: number = 2 + 2 + COPY_LABEL.length;

export interface CodeBlockLayout {
  /** The cell where the code starts, from the block's left edge. */
  readonly codeX: number;
  /** How many cells across the code has, its padding included. */
  readonly codeCols: number;
  /** The first cell of the copy button in the top edge, when there is one. */
  readonly copyX?: number;
}

export interface CodeBlockOptions {
  readonly title?: string;
  /** A gutter of line numbers, behind a rule that joins the frame. */
  readonly lineNumbers?: boolean;
  /** Leave room in the top edge for the copy button. */
  readonly copyable?: boolean;
  /** Which border set draws the frame; the theme's when not given. */
  readonly border?: BorderSetName;
  /**
   * The frame around the code, with the title and the copy button in its top
   * edge. On by default. Off, the block is the code alone, a row a line, for
   * a place that already frames it, such as a pane: no title, no copy button,
   * and the line numbers behind their rule if asked for.
   */
  readonly frame?: boolean;
}

/** Where the parts of a block `width` cells wide go, for `lines` lines of code. */
export function layoutCodeBlock(
  width: number,
  lines: number,
  options: CodeBlockOptions = {},
): CodeBlockLayout {
  const digits = String(Math.max(1, lines)).length;
  if (options.frame === false) {
    // `12 │`: the numbers, a space, the rule; no border either side.
    const codeX = options.lineNumbers ? digits + 2 : 0;
    return { codeX, codeCols: Math.max(0, width - codeX) };
  }
  // `│ 12 │`: the border, a space, the numbers, a space, the rule.
  const gutter = options.lineNumbers ? digits + 3 : 0;
  const codeX = gutter + 1;
  const codeCols = Math.max(0, width - codeX - 1);
  const copyX = width - 2 - COPY_CELLS;
  return {
    codeX,
    codeCols,
    ...(options.copyable && copyX > codeX + 1 ? { copyX } : {}),
  };
}

/**
 * The block's chrome as a buffer: its frame, its title, its gutter and rule,
 * the numbers, and the gap the copy button sits in. The code is real text and
 * is not in here; `codeBlockText` puts it in, for the snapshot.
 */
export function codeBlockBuffer(
  size: Size,
  options: CodeBlockOptions = {},
  glyphs: Glyphs = themeGlyphs.default,
): Buffer {
  const lines = Math.max(0, size.height - (options.frame === false ? 0 : 2));
  const layout = layoutCodeBlock(size.width, lines, options);
  const border = options.border ?? glyphs.borderSet;
  const set = borderSets[border];
  const ellipsis = set.ascii ? marks.ascii.ellipsis : glyphs.mark.ellipsis;
  if (options.frame === false) {
    // The code alone: the numbers and their rule, if asked for, and nothing else.
    return Buffer.create(size).draw((draft) => {
      if (!options.lineNumbers || size.height < 1) return;
      const rule = layout.codeX - 1;
      drawRule(draft, rect(rule, 0, 1, size.height), { orientation: 'vertical', border }, glyphs);
      // Run it to the block's top and bottom edge rather than stop half a cell
      // short: whatever holds the block is above and below it.
      const draw = { set, style: LINE };
      addEdges(draft, { x: rule, y: 0 }, { north: set.weight }, draw);
      addEdges(draft, { x: rule, y: size.height - 1 }, { south: set.weight }, draw);
      const digits = rule - 1;
      for (let n = 1; n <= size.height; n++) {
        drawText(draft, { x: 0, y: n - 1 }, String(n).padStart(digits), { style: NUMBER });
      }
    });
  }
  return Buffer.create(size).draw((draft) => {
    if (size.width < 2 || size.height < 2) return;
    drawBox(draft, rect(0, 0, size.width, size.height), { set, style: LINE });
    const gutter = options.lineNumbers ? layout.codeX - 1 : 0;
    if (options.lineNumbers) {
      // The rule runs border to border, so the table draws its tees.
      drawRule(draft, rect(gutter, 0, 1, size.height), { orientation: 'vertical', border }, glyphs);
      const digits = gutter - 3;
      for (let n = 1; n <= lines; n++) {
        drawText(draft, { x: 2, y: n }, String(n).padStart(digits), { style: NUMBER });
      }
    }
    const end = layout.copyX === undefined ? size.width : layout.copyX - 1;
    if (layout.copyX !== undefined) gap(draft, layout.copyX - 1, COPY_CELLS + 2);
    if (options.title !== undefined && options.title !== '') {
      // Over the code, after the rule; it stops short of the copy button.
      drawLabel(draft, rect(gutter, 0, end - gutter + 1, 1), options.title, {
        set,
        style: TITLE,
        lineStyle: LINE,
        ellipsis,
      });
    }
  });
}

/** Blank `count` cells of the top edge: the button is drawn there by the page. */
function gap(draft: Draft, x: number, count: number): void {
  drawText(draft, { x, y: 0 }, ' '.repeat(count));
}

/**
 * The whole block as text, code included, clipped to its width: what a
 * reader sees, as the snapshot tests it. The copy button is drawn as the
 * text it shows.
 */
export function codeBlockText(
  code: string,
  options: CodeBlockOptions & { readonly cols: number },
  glyphs: Glyphs = themeGlyphs.default,
): Buffer {
  const lines = code.split('\n');
  const framed = options.frame !== false;
  const size = { width: options.cols, height: lines.length + (framed ? 2 : 0) };
  const layout = layoutCodeBlock(size.width, lines.length, options);
  const chrome = codeBlockBuffer(size, options, glyphs);
  const [open, close] = glyphs.delimiter.control;
  return Buffer.create(size).draw((draft) => {
    copyInto(draft, chrome, 0, 0);
    lines.forEach((line, y) => {
      drawText(draft, { x: layout.codeX + 1, y: y + (framed ? 1 : 0) }, line, {
        maxWidth: Math.max(0, layout.codeCols - 2),
      });
    });
    if (layout.copyX !== undefined) {
      drawText(draft, { x: layout.copyX, y: 0 }, `${open} ${COPY_LABEL} ${close}`);
    }
  });
}

/** Copy every cell of `from` into `draft` at `x`, `y`, edges and all. */
function copyInto(draft: Draft, from: Buffer, x: number, y: number): void {
  for (let row = 0; row < from.height; row++) {
    for (let col = 0; col < from.width; col++) {
      const at = { x: x + col, y: y + row };
      const cell = from.at({ x: col, y: row });
      const edges = from.edgesAt({ x: col, y: row });
      if (edges) draft.setEdges(at, edges);
      if (cell) draft.set(at, cell);
    }
  }
}

/**
 * A text snapshot in a frame, as a buffer: the snapshot read back into cells
 * (`fromText`) and set inside the border, a cell in from the sides. Every box
 * character in it is a shape the cell renderer strokes.
 */
export function snapshotBuffer(
  text: string,
  options: { readonly title?: string; readonly copyable?: boolean; readonly cols?: number } = {},
  glyphs: Glyphs = themeGlyphs.default,
): Buffer {
  const snapshot = fromText(text);
  const natural = snapshot.width + 4;
  const minimum = options.copyable ? COPY_CELLS + 4 + titleRoom(options.title) : 0;
  const width = options.cols ?? Math.max(natural, minimum);
  const size = { width, height: snapshot.height + 2 };
  const frame = codeBlockBuffer(
    size,
    {
      ...(options.title === undefined ? {} : { title: options.title }),
      ...(options.copyable === undefined ? {} : { copyable: options.copyable }),
    },
    glyphs,
  );
  return Buffer.create(size).draw((draft) => {
    copyInto(draft, frame, 0, 0);
    // The snapshot's cells, but not its edges: it is a picture set in the
    // frame, not more lines for the frame to join.
    for (let y = 0; y < snapshot.height; y++) {
      for (let x = 0; x < Math.min(snapshot.width, width - 4); x++) {
        const cell = snapshot.at({ x, y });
        if (cell) draft.set({ x: x + 2, y: y + 1 }, cell);
      }
    }
  });
}

const titleRoom = (title: string | undefined): number =>
  title === undefined ? 0 : stringWidth(title) + 3;

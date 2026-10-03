'use client';

/**
 * `CodeBlock` (cairn 0138): code and text snapshots on a page, framed,
 * titled, copyable, and on the grid.
 *
 * Code is real text in a `<pre><code>`: selectable, findable, read by a
 * screen reader, coloured by the syntax roles (0144) when a highlighter has
 * marked it. The frame around it is painted: a title in the top edge, an
 * optional gutter of line numbers behind a rule that joins the frame, and a
 * slot in the top edge for the copy button. A line too long for the block
 * scrolls sideways inside it, in whole cells.
 *
 * Box drawing inside code (a diagram in a comment) is drawn by the cell, not
 * the font (0116): each such character is a cell box the renderer strokes,
 * the character kept, transparent, so copying gives the text.
 *
 * `CodeSnapshot` shows a text snapshot, a component's documentation. It is
 * read back into a buffer and painted through the cell renderer, so its lines
 * meet at every density. It is a figure: a reader hears what it shows, from
 * its label, not its box characters one by one.
 */
import {
  Attr,
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
  shapeOf,
  stringWidth,
} from '@rockaway/grid';
import { type Glyphs, marks, type SyntaxRole } from '@rockaway/tokens';
import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { VisuallyHidden } from 'react-aria-components';
import { cx } from '../cx.ts';
import { defaultGlyphs, useGlyphs } from '../glyphs.tsx';
import { Screen, type ScreenProps } from '../screen.tsx';
import { Button } from './button.tsx';
import { drawRule } from './divider.tsx';

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
const COPY_LABEL = 'Copy';
const DONE_LABEL = 'Done';
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
}

/** Where the parts of a block `width` cells wide go, for `lines` lines of code. */
export function layoutCodeBlock(
  width: number,
  lines: number,
  options: CodeBlockOptions = {},
): CodeBlockLayout {
  const digits = String(Math.max(1, lines)).length;
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
  glyphs: Glyphs = defaultGlyphs,
): Buffer {
  const lines = Math.max(0, size.height - 2);
  const layout = layoutCodeBlock(size.width, lines, options);
  const border = options.border ?? glyphs.borderSet;
  const set = borderSets[border];
  const ellipsis = set.ascii ? marks.ascii.ellipsis : glyphs.mark.ellipsis;
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
  glyphs: Glyphs = defaultGlyphs,
): Buffer {
  const lines = code.split('\n');
  const size = { width: options.cols, height: lines.length + 2 };
  const layout = layoutCodeBlock(size.width, lines.length, options);
  const chrome = codeBlockBuffer(size, options, glyphs);
  const [open, close] = glyphs.delimiter.control;
  return Buffer.create(size).draw((draft) => {
    copyInto(draft, chrome, 0, 0);
    lines.forEach((line, y) => {
      drawText(draft, { x: layout.codeX + 1, y: y + 1 }, line, {
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
  glyphs: Glyphs = defaultGlyphs,
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

/** A piece of a line of code: plain text, or one shaped character in a run of them. */
export interface CodeRun {
  readonly text: string;
  /** The shape the cell draws, when the characters are box drawing or blocks. */
  readonly shape?: string;
  /** How many cells the run covers. */
  readonly cells: number;
}

/**
 * Split text into plain runs and runs of characters the cell draws (0116): a
 * line across the cell joins its neighbour, so a run of `─` is one box; any
 * other shape is a cell of its own. The one way code and prose put box
 * drawing on the grid.
 */
export function codeRuns(text: string): CodeRun[] {
  const out: CodeRun[] = [];
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

/** Text, with box drawing set in cells the renderer strokes. */
function Shaped({ text }: { readonly text: string }): ReactNode {
  return codeRuns(text).map((run, i) =>
    run.shape === undefined ? (
      // biome-ignore lint/suspicious/noArrayIndexKey: runs are positional.
      <span key={i}>{run.text}</span>
    ) : (
      <span
        // biome-ignore lint/suspicious/noArrayIndexKey: runs are positional.
        key={i}
        className="rk-code-shape"
        data-rk-shape={run.shape}
        style={{ '--rk-run': run.cells } as CSSProperties}
      >
        {run.text}
      </span>
    ),
  );
}

export interface CodeBlockProps
  extends Omit<ScreenProps, 'draw' | 'contentInset' | 'children' | 'role' | 'rows' | 'title'>,
    Omit<CodeBlockOptions, 'copyable'> {
  /** The code, exactly: what is shown, what is copied. */
  readonly code: string;
  /**
   * The same code, highlighted: one line of tokens per line, each token a
   * role from the syntax tokens (0144). Joined, it must be `code`.
   */
  readonly tokens?: readonly CodeLine[];
  /** The language, for a reader, and the title when there is none. */
  readonly lang?: string;
  /** A copy button in the top edge. On by default. */
  readonly copyable?: boolean;
  /** The block's accessible name, when the title is not the right one. */
  readonly label?: string;
}

/** How long a copy is marked, in milliseconds. */
const COPIED = 2000;

/** The copy button, with a mark kept in a cell of its own, and the "Copied" a reader hears. */
function useCopy(code: string): {
  copied: boolean;
  said: string;
  copy: () => void;
} {
  const [copied, setCopied] = useState(false);
  const [said, setSaid] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = useCallback(() => {
    const done = (): void => {
      setCopied(true);
      // Emptied first, so a second copy is a change a reader is told about.
      setSaid('');
      setTimeout(() => setSaid('Copied'), 0);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), COPIED);
    };
    navigator.clipboard?.writeText(code).then(done, () => setSaid('Could not copy'));
  }, [code]);
  return { copied, said, copy };
}

function CopyButton({
  code,
  name,
  x,
}: {
  readonly code: string;
  readonly name: string;
  readonly x: number;
}): ReactNode {
  const { copied, said, copy } = useCopy(code);
  return (
    <span
      className="rk-code-copy"
      style={{ '--rk-code-copy-x': x } as CSSProperties}
      {...(copied ? { 'data-copied': '' } : {})}
    >
      <Button aria-label={`Copy ${name}`} onPress={copy}>
        {copied ? DONE_LABEL : COPY_LABEL}
      </Button>
      <VisuallyHidden role="status">{said}</VisuallyHidden>
    </span>
  );
}

/**
 * Code in a frame: its title in the top edge, line numbers behind a rule when
 * asked for, a copy button, and the code as real text that scrolls sideways in
 * whole cells when it is wider than the block.
 */
export function CodeBlock({
  code,
  tokens,
  lang,
  title,
  lineNumbers,
  copyable = true,
  border,
  label,
  className,
  ...screen
}: CodeBlockProps): ReactNode {
  const glyphs = useGlyphs();
  const lines = code.split('\n');
  const shown = title ?? lang;
  const name = label ?? shown ?? 'code';
  const options: CodeBlockOptions = {
    ...(shown === undefined ? {} : { title: shown }),
    ...(lineNumbers === undefined ? {} : { lineNumbers }),
    copyable,
    ...(border === undefined ? {} : { border }),
  };
  const key = JSON.stringify(options);
  // biome-ignore lint/correctness/useExhaustiveDependencies: keyed on the options' contents.
  const draw = useMemo(() => (size: Size) => codeBlockBuffer(size, options, glyphs), [key, glyphs]);
  const longest = Math.max(0, ...lines.map(stringWidth));
  const highlighted =
    tokens !== undefined &&
    tokens.map((line) => line.map((t) => t.text).join('')).join('\n') === code
      ? tokens
      : lines.map((line): CodeLine => [{ text: line }]);

  return (
    <Screen
      {...screen}
      rows={lines.length + 2}
      draw={draw}
      className={cx('rk-code', className)}
      role="group"
      aria-label={name}
    >
      {(size: Size) => {
        const layout = layoutCodeBlock(size.width, lines.length, options);
        const style = {
          '--rk-code-x': layout.codeX,
          '--rk-code-cols': layout.codeCols,
          '--rk-code-rows': lines.length,
          '--rk-code-longest': longest,
        } as CSSProperties;
        const scrolls = longest + 2 > layout.codeCols;
        return (
          <>
            <pre
              className="rk-code-text"
              style={style}
              // A box that scrolls has to be reachable by keyboard to be scrolled by one.
              {...(scrolls ? { tabIndex: 0 } : {})}
            >
              <code
                {...(lang === undefined ? {} : { 'data-lang': lang })}
                data-rk-offgrid="scrolled sideways inside its whole-cell box: it rests on whole cells, snapped to the ruler, but passes through fractions of one while it moves"
              >
                {highlighted.map((line, y) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: lines are positional.
                  <span key={y} className="rk-code-line">
                    {line.map((token, i) => (
                      <span
                        // biome-ignore lint/suspicious/noArrayIndexKey: tokens are positional.
                        key={i}
                        {...(token.role === undefined
                          ? {}
                          : { className: `rk-syntax-${token.role}` })}
                      >
                        <Shaped text={token.text} />
                      </span>
                    ))}
                    {y < highlighted.length - 1 ? '\n' : null}
                  </span>
                ))}
                {/* One snap point a cell, so a scroll comes to rest on whole cells. */}
                <span className="rk-code-ruler" aria-hidden="true">
                  {scrolls
                    ? Array.from({ length: longest + 2 }, (_, i) => (
                        // biome-ignore lint/suspicious/noArrayIndexKey: one per cell.
                        <span key={i} />
                      ))
                    : null}
                </span>
              </code>
            </pre>
            {layout.copyX === undefined ? null : (
              <CopyButton code={code} name={name} x={layout.copyX} />
            )}
          </>
        );
      }}
    </Screen>
  );
}

export interface CodeSnapshotProps
  extends Omit<ScreenProps, 'draw' | 'contentInset' | 'children' | 'role' | 'rows' | 'title'> {
  /** The text snapshot, as `toText` writes it. */
  readonly text: string;
  /**
   * What the snapshot shows, said in words: a reader hears this, not the box
   * characters one by one.
   */
  readonly label: string;
  /** Set into the top edge: what it is a snapshot of. */
  readonly title?: string;
  /** A copy button in the top edge. On by default. */
  readonly copyable?: boolean;
}

/**
 * A text snapshot, painted through the cell renderer so its lines meet at
 * every density. A figure: an image named by `label`, captioned by `title`.
 */
export function CodeSnapshot({
  text,
  label,
  title,
  copyable = true,
  cols,
  className,
  ...screen
}: CodeSnapshotProps): ReactNode {
  const glyphs = useGlyphs();
  const options = {
    ...(title === undefined ? {} : { title }),
    copyable,
    ...(cols === undefined ? {} : { cols }),
  };
  const key = JSON.stringify(options);
  // biome-ignore lint/correctness/useExhaustiveDependencies: keyed on the options' contents.
  const buffer = useMemo(() => snapshotBuffer(text, options, glyphs), [text, key, glyphs]);
  const draw = useCallback(() => buffer, [buffer]);
  const layout = layoutCodeBlock(buffer.width, buffer.height - 2, { copyable });
  const picture = {
    '--rk-code-cols': Math.max(0, buffer.width - 4),
    '--rk-code-rows': buffer.height - 2,
  } as CSSProperties;
  return (
    <figure className={cx('rk-code-figure', className)}>
      <Screen
        {...screen}
        cols={buffer.width}
        rows={buffer.height}
        draw={draw}
        className="rk-code rk-code-snapshot"
      >
        {/* The picture, for a reader: one image named in words, over its cells. */}
        <span className="rk-code-image" role="img" aria-label={label} style={picture} />
        {layout.copyX === undefined ? null : (
          <CopyButton code={text} name={title ?? 'snapshot'} x={layout.copyX} />
        )}
      </Screen>
      {title === undefined ? null : (
        <VisuallyHidden elementType="figcaption">{title}</VisuallyHidden>
      )}
    </figure>
  );
}

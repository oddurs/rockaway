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
import { type Size, shapeRuns, stringWidth } from '@rockaway/grid';
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
import { useGlyphs } from '../glyphs.tsx';
import { Screen, type ScreenProps } from '../screen.tsx';
import { Button } from './button.tsx';
import {
  COPY_LABEL,
  type CodeBlockOptions,
  type CodeLine,
  codeBlockBuffer,
  DONE_LABEL,
  layoutCodeBlock,
  snapshotBuffer,
} from './code-block.pure.ts';

/** Text, with box drawing set in cells the renderer strokes. */
function Shaped({ text }: { readonly text: string }): ReactNode {
  return shapeRuns(text).map((run, i) =>
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
  /** A copy button in the top edge. On by default; a block with no frame has none. */
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
  frame = true,
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
    copyable: copyable && frame,
    ...(border === undefined ? {} : { border }),
    ...(frame ? {} : { frame }),
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
      rows={lines.length + (frame ? 2 : 0)}
      draw={draw}
      // A pane, to the conformance levels: whole cells even at `loose` (0182).
      data-rk-pane=""
      className={cx('rk-code', className)}
      role="group"
      aria-label={name}
    >
      {(size: Size) => {
        const layout = layoutCodeBlock(size.width, lines.length, options);
        const style = {
          '--rk-code-x': layout.codeX,
          '--rk-code-y': frame ? 1 : 0,
          '--rk-code-cols': layout.codeCols,
          '--rk-code-rows': lines.length,
          '--rk-code-longest': longest,
        } as CSSProperties;
        const scrolls = longest + 2 > layout.codeCols;
        return (
          <>
            <pre
              className="rk-code-text rk-scroll rk-scroll-marks"
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
        data-rk-pane=""
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

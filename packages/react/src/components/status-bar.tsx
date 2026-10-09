'use client';

/**
 * `StatusBar` (cairn 0098): the bar every TUI has, one row at the bottom of a
 * screen. Mode, context, position, what the keys do, and the message line a
 * TUI has instead of toasts.
 *
 * The bar is a screen exactly one row tall. Its ground is painted in cells;
 * its segments are real elements laid over it, each a whole number of cells
 * wide. Where they go is solved in cells by `fitStatus`, which is pure: when
 * the row is too narrow, the lowest priority segment is cut first, ending in
 * the theme's ellipsis, then hidden, and the next is cut after it. A segment
 * never wraps, so the bar is one row at every width.
 *
 * Segments are measured in cells from the page, because their content is
 * whatever the caller puts there: text, a KeyHint, a count. Before that, and
 * on a server, a segment whose content is text is placed at the text's width,
 * which is known without a page, so a bar sent with no script still shows its
 * words. Only a segment whose width cannot be known until it is laid out
 * waits, hidden, for the measure.
 *
 * The message slot is a polite `role="status"` region that is always present,
 * so a message is announced once when it arrives. It shows for a few seconds
 * and is replaced, not stacked, by the next. Segments are not live: a cursor
 * position that changes on every key is not read on every key.
 */
import { type Size, stringWidth } from '@rockaway/grid';
import type { Glyphs } from '@rockaway/tokens';
import {
  Children,
  type CSSProperties,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { cx } from '../cx.ts';
import { useGlyphs } from '../glyphs.tsx';
import { type Platform, usePlatform } from '../platform.ts';
import { Screen, type ScreenProps } from '../screen.tsx';
import type { VariantProps } from '../variants.ts';
import { keyHintCells } from './key-hint.pure.ts';
import { KeyHint } from './key-hint.tsx';
import {
  fitStatus,
  groundBuffer,
  PAD,
  type StatusAlign,
  type StatusPlacement,
  type StatusSegmentVariant,
  statusSegmentVariants,
} from './status-bar.pure.ts';

export interface StatusSegmentProps extends VariantProps<typeof statusSegmentVariants> {
  /** When the bar is too narrow, the lowest priority is cut first. 0 by default. */
  readonly priority?: number;
  /** Which end of the bar it packs against, or the middle. `start` by default. */
  readonly align?: StatusAlign;
  /** `mode` is what the bar is about now, `NORMAL` or `INSERT`: drawn in reverse video. */
  readonly variant?: StatusSegmentVariant;
  /** What the segment is, for a reader, when its text alone does not say. */
  readonly label?: string;
  readonly className?: string;
  readonly children?: ReactNode;
}

/** A segment of a `StatusBar`. It describes the segment; the bar lays it out. */
export function StatusSegment(_props: StatusSegmentProps): ReactNode {
  return null;
}

export interface StatusMessageProps {
  /** The message. A new one replaces the one before. */
  readonly children?: ReactNode;
  /**
   * Changes to show the same message again: a second "Copied" is a new
   * message, though its text has not changed.
   */
  readonly id?: string | number;
  /** How long it shows, in milliseconds. Four seconds by default. */
  readonly duration?: number;
  readonly priority?: number;
  readonly align?: StatusAlign;
}

/** The bar's message line. Announced once, politely; shown for a few seconds. */
export function StatusMessage(_props: StatusMessageProps): ReactNode {
  return null;
}

export interface StatusBarProps
  extends Omit<ScreenProps, 'draw' | 'contentInset' | 'children' | 'role' | 'rows'> {
  /** What the bar is called, for a reader. `Status` by default. */
  readonly label?: string;
  /** `StatusSegment`s and at most one `StatusMessage`, in order. */
  readonly children?: ReactNode;
}

type Part =
  | { readonly kind: 'segment'; readonly props: StatusSegmentProps }
  | { readonly kind: 'message'; readonly props: StatusMessageProps };

function isElementOf<P>(node: ReactNode, type: (props: P) => ReactNode): node is ReactElement<P> {
  return isValidElement(node) && node.type === type;
}

const MESSAGE_PRIORITY = 100;

/**
 * A segment's width in cells when its content is text, which is known without
 * laying it out; undefined for anything else, which only the page can measure.
 */
function textCells(children: ReactNode, platform: Platform, glyphs: Glyphs): number | undefined {
  let cells = 0;
  let elements = 0;
  for (const item of Children.toArray(children)) {
    if (typeof item === 'string' || typeof item === 'number') {
      cells += stringWidth(String(item));
      continue;
    }
    // An element after another is a cell apart from it (status-bar.css).
    if (elements++ > 0) cells += 1;
    // A key hint's width is its legend and its label, both strings: known
    // without a page, as text is.
    if (!isElementOf(item, KeyHint)) return undefined;
    const { keys, children: label, platform: own = 'auto', notation } = item.props;
    if (label !== undefined && typeof label !== 'string') return undefined;
    cells += keyHintCells(keys, label, own === 'auto' ? platform : own, notation, glyphs);
  }
  return cells;
}

/**
 * Fit only the parts whose width is known; the others are left unplaced, and
 * hidden until they are measured.
 */
function fitKnown(
  width: number,
  parts: readonly Part[],
  cells: readonly (number | undefined)[],
): (StatusPlacement | undefined)[] {
  const known = parts.flatMap((part, i) => {
    const n = cells[i];
    return n === undefined ? [] : [{ part, i, cells: n }];
  });
  const placed = fitStatus(
    width,
    known.map(({ part, cells }) => ({
      cells,
      priority: part.props.priority ?? (part.kind === 'message' ? MESSAGE_PRIORITY : 0),
      align: part.props.align ?? 'start',
      keep: part.kind === 'message',
    })),
  );
  const out: (StatusPlacement | undefined)[] = parts.map(() => undefined);
  known.forEach(({ i }, k) => {
    out[i] = placed[k];
  });
  return out;
}

/** Runs before paint in a browser, and not at all on a server. */
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
const DURATION = 4000;

/**
 * One row at the bottom of a screen. Give it `StatusSegment`s, and a
 * `StatusMessage` for the message line.
 */
export function StatusBar({
  label = 'Status',
  className,
  children,
  ...screen
}: StatusBarProps): ReactNode {
  const glyphs = useGlyphs();
  // The keyboard a hint is drawn for: the neutral one on a server and on the
  // render that hydrates, the reader's after, as KeyHint does (0132).
  const platform = usePlatform();
  const parts: Part[] = Children.toArray(children).flatMap((child): Part[] => {
    if (isElementOf(child, StatusSegment)) return [{ kind: 'segment', props: child.props }];
    if (isElementOf(child, StatusMessage)) return [{ kind: 'message', props: child.props }];
    return [];
  });

  // Each segment's content, measured in cells. Unknown until the page has
  // laid it out, and remeasured whenever any of it changes size.
  const spans = useRef(new Map<number, HTMLElement>());
  const [cells, setCells] = useState<readonly number[] | undefined>(undefined);
  const measure = useCallback(() => {
    const next: number[] = [];
    for (let i = 0; i < spans.current.size; i++) {
      const span = spans.current.get(i);
      const screen = span?.closest<HTMLElement>('.rk-screen');
      if (!span || !screen) return;
      const cell = Number.parseFloat(getComputedStyle(screen).getPropertyValue('--rk-cell-width'));
      if (!Number.isFinite(cell) || cell <= 0) return;
      // Text is whole advances; a hair over a whole cell is rounding, not a cell.
      next.push(Math.ceil(span.getBoundingClientRect().width / cell - 0.05));
    }
    setCells((was) =>
      was !== undefined && was.length === next.length && was.every((n, i) => n === next[i])
        ? was
        : next,
    );
  }, []);
  useIsomorphicLayoutEffect(() => {
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => measure());
    for (const span of spans.current.values()) {
      observer.observe(span);
      const screen = span.closest('.rk-screen');
      if (screen) observer.observe(screen);
    }
    return () => observer.disconnect();
  });
  const register = useCallback(
    (index: number) => (el: HTMLElement | null) => {
      if (el) spans.current.set(index, el);
      else spans.current.delete(index);
    },
    [],
  );

  const draw = useMemo(() => groundBuffer, []);
  // Until the page has measured: text at its own width, and nothing else. A
  // message has not arrived yet on the first render, so it is no cells.
  const guessed = parts.map((part) =>
    part.kind === 'message' ? 0 : textCells(part.props.children, platform, glyphs),
  );

  return (
    <Screen
      {...screen}
      rows={1}
      draw={draw}
      className={cx('rk-statusbar', className)}
      role="region"
      aria-label={label}
    >
      {(size: Size) => {
        const placed = fitKnown(
          size.width,
          parts,
          cells !== undefined && cells.length === parts.length ? cells : guessed,
        );
        return parts.map((part, i) => (
          <Segment
            // biome-ignore lint/suspicious/noArrayIndexKey: segments are positional.
            key={i}
            part={part}
            placed={placed[i]}
            ellipsis={glyphs.mark.ellipsis}
            measured={register(i)}
          />
        ));
      }}
    </Screen>
  );
}

function Segment({
  part,
  placed,
  ellipsis,
  measured,
}: {
  readonly part: Part;
  readonly placed: StatusPlacement | undefined;
  readonly ellipsis: string;
  readonly measured: (el: HTMLElement | null) => void;
}): ReactNode {
  // Text is placed from the first render, on a server too. Anything else is
  // laid out before it is placed, and placed before the browser paints, so an
  // unplaced segment is never seen.
  const style = (
    placed === undefined
      ? { visibility: 'hidden' }
      : {
          '--rk-status-x': placed.x,
          '--rk-status-cols': placed.width,
          '--rk-status-room': Math.max(0, placed.width - 2 * PAD - (placed.truncated ? 1 : 0)),
        }
  ) as CSSProperties;
  const attributes = {
    className: cx('rk-status-segment', part.kind === 'segment' ? part.props.className : undefined),
    style,
    ...(placed?.truncated ? { 'data-truncated': '' } : {}),
    ...(part.kind === 'segment'
      ? statusSegmentVariants.dataAttributes(
          statusSegmentVariants.select({ variant: part.props.variant }),
        )
      : {}),
    // A segment cut away entirely is hidden; the message slot never is, so it
    // stays a live region and the next message is still announced.
    ...(placed?.hidden && part.kind === 'segment' ? { hidden: true } : {}),
  };
  const content =
    part.kind === 'message' ? (
      <Message {...part.props} measured={measured} />
    ) : (
      <span ref={measured} className="rk-status-content">
        {part.props.children}
      </span>
    );
  const cut =
    placed?.truncated && placed.width > 0 ? (
      <span className="rk-status-ellipsis" aria-hidden="true">
        {ellipsis}
      </span>
    ) : null;
  if (part.kind === 'message') {
    return (
      <span {...attributes} role="status">
        <span className="rk-status-room">{content}</span>
        {cut}
      </span>
    );
  }
  return (
    <span
      {...attributes}
      {...(part.props.label === undefined ? {} : { 'aria-label': part.props.label })}
    >
      <span className="rk-status-room">{content}</span>
      {cut}
    </span>
  );
}

/** The message line's text: shown when it arrives, cleared after its time. */
function Message({
  children,
  id,
  duration = DURATION,
  measured,
}: StatusMessageProps & { readonly measured: (el: HTMLElement | null) => void }): ReactNode {
  const [shown, setShown] = useState<ReactNode>(null);
  const text =
    typeof children === 'string' || typeof children === 'number' ? String(children) : undefined;
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new id or new text is a new message.
  useEffect(() => {
    if (children === undefined || children === null || children === '') {
      setShown(null);
      return;
    }
    setShown(children);
    const timer = setTimeout(() => setShown(null), duration);
    return () => clearTimeout(timer);
  }, [text, id, duration]);
  return (
    <span ref={measured} className="rk-status-content">
      {shown}
    </span>
  );
}

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
 * whatever the caller puts there: text, a KeyHint, a count.
 *
 * The message slot is a polite `role="status"` region that is always present,
 * so a message is announced once when it arrives. It shows for a few seconds
 * and is replaced, not stacked, by the next. Segments are not live: a cursor
 * position that changes on every key is not read on every key.
 */
import {
  Attr,
  Buffer,
  drawText,
  type Size,
  type Style,
  stringWidth,
  truncate,
} from '@rockaway/grid';
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
import { defaultGlyphs, useGlyphs } from '../glyphs.tsx';
import { Screen, type ScreenProps } from '../screen.tsx';
import {
  defineVariants,
  type VariantProps,
  type Variants,
  type VariantValue,
} from '../variants.ts';

const VARIANTS = { variant: ['default', 'mode'] } as const;

/** A segment's variants, as data: the props, the attribute and the metadata all read this. */
export const statusSegmentVariants: Variants<typeof VARIANTS> = defineVariants(VARIANTS, {
  variant: 'default',
});

export type StatusSegmentVariant = VariantValue<typeof statusSegmentVariants, 'variant'>;

export type StatusAlign = 'start' | 'center' | 'end';

/** A segment, as the layout reads it: how wide it wants to be, and how much it matters. */
export interface StatusFit {
  /** Its content's width, in cells. A cell of padding either side is added. */
  readonly cells: number;
  /** When the row is too narrow, the lowest priority is cut first. */
  readonly priority?: number;
  readonly align?: StatusAlign;
  /** Never hidden for want of room, only cut: the message slot, which must stay live. */
  readonly keep?: boolean;
}

/** Where a segment landed, in cells. */
export interface StatusPlacement {
  readonly x: number;
  /** Its width, padding included. Zero when hidden. */
  readonly width: number;
  /** Cut short of its content, the last content cell given to the ellipsis. */
  readonly truncated: boolean;
  /** Cut away entirely. */
  readonly hidden: boolean;
}

/** A cell of padding either side of every segment's content: ` NORMAL `. */
const PAD = 1;
/** The narrowest a cut segment is drawn: a letter and the ellipsis, padded. */
const NARROWEST = 2 * PAD + 2;

/**
 * Fit segments into a row `width` cells wide. Pure: the component and the
 * snapshot both lay out with it. Segments keep their order within each
 * alignment; start ones pack from the left, end ones from the right, and the
 * centre ones sit in the middle of what is left.
 */
export function fitStatus(width: number, segments: readonly StatusFit[]): StatusPlacement[] {
  const widths = segments.map((s) => (s.cells > 0 ? s.cells + 2 * PAD : 0));
  const total = (): number => widths.reduce((sum, w) => sum + w, 0);

  // Cut the least important first: down to the narrowest, then away. The
  // later of equals goes first, so the bar keeps its left end, as text does.
  while (total() > Math.max(0, width)) {
    let cut = -1;
    segments.forEach((s, i) => {
      if ((widths[i] as number) === 0 || (s.keep === true && (widths[i] as number) <= NARROWEST)) {
        return;
      }
      const best = cut < 0 ? undefined : segments[cut];
      if (best === undefined || (s.priority ?? 0) <= (best.priority ?? 0)) cut = i;
    });
    if (cut < 0) break;
    const over = total() - width;
    const now = widths[cut] as number;
    const floor = segments[cut]?.keep === true ? Math.min(now, NARROWEST) : NARROWEST;
    widths[cut] = now - over >= floor ? now - over : now > floor ? floor : 0;
  }

  const group = (align: StatusAlign) =>
    segments.flatMap((s, i) => ((s.align ?? 'start') === align ? [i] : []));
  const sum = (indices: number[]) => indices.reduce((n, i) => n + (widths[i] as number), 0);
  const starts = group('start');
  const ends = group('end');
  const centres = group('center');

  const x = segments.map(() => 0);
  let at = 0;
  for (const i of starts) {
    x[i] = at;
    at += widths[i] as number;
  }
  const left = at;
  at = width - sum(ends);
  const right = at;
  for (const i of ends) {
    x[i] = at;
    at += widths[i] as number;
  }
  const middle = sum(centres);
  at = Math.min(Math.max(left, Math.floor((width - middle) / 2)), Math.max(left, right - middle));
  for (const i of centres) {
    x[i] = at;
    at += widths[i] as number;
  }

  return segments.map((s, i) => {
    const w = widths[i] as number;
    const natural = s.cells > 0 ? s.cells + 2 * PAD : 0;
    return { x: x[i] as number, width: w, truncated: w < natural, hidden: w === 0 && natural > 0 };
  });
}

/** A text segment, for the buffer: what the snapshot draws. */
export interface StatusText extends Omit<StatusFit, 'cells'> {
  readonly text: string;
  readonly variant?: StatusSegmentVariant;
}

const GROUND: Style = { bg: 'bg.subtle', attrs: Attr.none };
const REVERSE: Style = { bg: 'bg.subtle', attrs: Attr.reverse };

/**
 * The bar as text: its ground, and text segments laid out by `fitStatus`, cut
 * with the theme's ellipsis. The text snapshot, and the cells the component's
 * segments land in.
 */
export function statusBarBuffer(
  width: number,
  segments: readonly StatusText[],
  glyphs: Glyphs = defaultGlyphs,
): Buffer {
  const placed = fitStatus(
    width,
    segments.map((s) => ({ ...s, cells: stringWidth(s.text) })),
  );
  return Buffer.create({ width: Math.max(0, width), height: 1 }).draw((draft) => {
    drawText(draft, { x: 0, y: 0 }, ' '.repeat(Math.max(0, width)), { style: GROUND });
    segments.forEach((s, i) => {
      const p = placed[i];
      if (p === undefined || p.width === 0) return;
      const room = p.width - 2 * PAD;
      const text = ` ${truncate(s.text, room, glyphs.mark.ellipsis)}`.padEnd(p.width);
      drawText(draft, { x: p.x, y: 0 }, text, { style: s.variant === 'mode' ? REVERSE : GROUND });
    });
  });
}

/** The ground alone: what the component paints under its segments. */
function groundBuffer({ width }: Size): Buffer {
  return Buffer.create({ width, height: 1 }).draw((draft) => {
    drawText(draft, { x: 0, y: 0 }, ' '.repeat(width), { style: GROUND });
  });
}

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
        const placed =
          cells === undefined || cells.length !== parts.length
            ? undefined
            : fitStatus(
                size.width,
                parts.map((part, i) => ({
                  cells: cells[i] as number,
                  priority: part.props.priority ?? (part.kind === 'message' ? MESSAGE_PRIORITY : 0),
                  align: part.props.align ?? 'start',
                  keep: part.kind === 'message',
                })),
              );
        return parts.map((part, i) => (
          <Segment
            // biome-ignore lint/suspicious/noArrayIndexKey: segments are positional.
            key={i}
            part={part}
            placed={placed?.[i]}
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
  // Laid out before it is placed, and placed before the browser paints, so an
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

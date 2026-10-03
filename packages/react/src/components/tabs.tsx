'use client';

/**
 * `Tabs` (cairn 0040): views that share one place, `files`, `log`, `diff`.
 *
 * The tab list is drawn into the top edge of the panel's frame, so tabs and
 * panel are one box: `┌ files ─ log ─ diff ─────┐`. Each tab is React Aria's,
 * a real element laid over a gap the buffer leaves in the edge, and the edge
 * between two tabs is a cell of line. The selected tab is reverse video and
 * bold (0118), which reads without colour; the rest are muted.
 *
 * When the tabs do not fit the edge they scroll by whole tabs, with the
 * theme's overflow marks at the ends, and the selected tab is always shown.
 * The keyboard is React Aria's: arrows move between tabs, Home and End jump,
 * and selection follows focus unless activation is manual.
 */
import {
  Attr,
  type BorderSetName,
  Buffer,
  borderSets,
  drawBox,
  drawText,
  rect,
  type Size,
  type Style,
} from '@rockaway/grid';
import type { Glyphs } from '@rockaway/tokens';
import {
  type CSSProperties,
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Tab as AriaTab,
  TabList as AriaTabList,
  type TabListProps as AriaTabListProps,
  TabPanel as AriaTabPanel,
  type TabPanelProps as AriaTabPanelProps,
  type TabProps as AriaTabProps,
  Tabs as AriaTabs,
  type TabsProps as AriaTabsProps,
  type Key,
  TabListStateContext,
} from 'react-aria-components';
import { cx } from '../cx.ts';
import { defaultGlyphs, useGlyphs } from '../glyphs.tsx';
import { type Inset, Screen, type ScreenProps } from '../screen.tsx';

const LINE: Style = { fg: 'border.default', attrs: Attr.none };
const MARK: Style = { fg: 'fg.muted', attrs: Attr.none };

/** Where the tabs landed in the top edge. */
export interface TabsLayout {
  /** Each tab's first cell, or undefined when it is scrolled out of the edge. */
  readonly x: readonly (number | undefined)[];
  /** Each tab's width in cells, its padding included; 0 when scrolled out. */
  readonly cols: readonly number[];
  /** Tabs scrolled off the start: the start mark is shown. */
  readonly before: boolean;
  /** Tabs scrolled off the end: the end mark is shown. */
  readonly after: boolean;
}

/**
 * Lay tabs into the top edge of a frame `width` cells wide. Each tab is its
 * label and a cell of air either side; a cell of line separates two tabs; the
 * corners and a cell of line before the far corner stay. When they do not all
 * fit, the window of tabs shown starts as early as it can while still showing
 * the selected one, and a mark at each end says there is more.
 */
export function layoutTabs(width: number, labels: readonly number[], selected: number): TabsLayout {
  const widths = labels.map((n) => n + 2);
  const place = (first: number): TabsLayout | undefined => {
    const before = first > 0;
    let start = before ? 3 : 1;
    const x: (number | undefined)[] = widths.map(() => undefined);
    const cols = widths.map(() => 0);
    // Try with no end mark; if a tab is left over, make room for one.
    for (const room of [width - 3, width - 4]) {
      start = before ? 3 : 1;
      x.fill(undefined);
      cols.fill(0);
      let last = first - 1;
      for (let i = first; i < widths.length; i++) {
        const w = widths[i] as number;
        if (start + w - 1 > room) break;
        x[i] = start;
        cols[i] = w;
        last = i;
        start += w + 1;
      }
      const after = last < widths.length - 1;
      if (!after || room === width - 4) {
        if (selected < first || selected > last) return undefined;
        return { x, cols, before, after };
      }
    }
    return undefined;
  };
  for (let first = 0; first <= Math.max(0, selected); first++) {
    const laid = place(first);
    if (laid !== undefined) return laid;
  }
  // Not even the selected tab fits on its own: it takes the room there is.
  const x = widths.map((): number | undefined => undefined);
  const cols = widths.map(() => 0);
  const before = selected > 0;
  const after = selected < widths.length - 1;
  const start = before ? 3 : 1;
  const end = after ? width - 4 : width - 3;
  if (selected >= 0 && selected < widths.length && end >= start) {
    x[selected] = start;
    cols[selected] = end - start + 1;
  }
  return { x, cols, before, after };
}

export interface TabsBufferOptions {
  readonly border?: BorderSetName;
}

/**
 * The frame with its tab gaps and overflow marks, as a buffer. The tabs are
 * real elements laid over the gaps, so their labels are not in here;
 * `tabsText` draws them in, for the snapshot.
 */
export function tabsBuffer(
  size: Size,
  layout: TabsLayout,
  options: TabsBufferOptions = {},
  glyphs: Glyphs = defaultGlyphs,
): Buffer {
  const set = borderSets[options.border ?? glyphs.borderSet];
  return Buffer.create(size).draw((draft) => {
    if (size.width < 2 || size.height < 2) return;
    drawBox(draft, rect(0, 0, size.width, size.height), { set, style: LINE });
    layout.x.forEach((x, i) => {
      if (x !== undefined) drawText(draft, { x, y: 0 }, ' '.repeat(layout.cols[i] as number));
    });
    if (layout.before)
      drawText(draft, { x: 1, y: 0 }, glyphs.mark['overflow-start'], { style: MARK });
    if (layout.after) {
      drawText(draft, { x: size.width - 2, y: 0 }, glyphs.mark['overflow-end'], { style: MARK });
    }
  });
}

/** The frame with its tabs' labels in it, as text: the snapshot. */
export function tabsText(
  size: Size,
  labels: readonly string[],
  selected: number,
  options: TabsBufferOptions = {},
  glyphs: Glyphs = defaultGlyphs,
): Buffer {
  const layout = layoutTabs(
    size.width,
    labels.map((l) => [...l].length),
    selected,
  );
  const frame = tabsBuffer(size, layout, options, glyphs);
  return frame.draw((draft) => {
    labels.forEach((label, i) => {
      const x = layout.x[i];
      if (x === undefined) return;
      drawText(draft, { x: x + 1, y: 0 }, label, {
        maxWidth: (layout.cols[i] as number) - 2,
        ellipsis: glyphs.mark.ellipsis,
      });
    });
  });
}

/** What the frame tells each tab: where it goes, and how to report its label's width. */
interface TabsFrame {
  readonly layout: TabsLayout | undefined;
  readonly keys: readonly Key[];
  readonly measure: (key: Key, el: HTMLElement | null) => void;
}

const FrameContext = createContext<TabsFrame | null>(null);

/** Runs before paint in a browser, and not at all on a server. */
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export interface TabsProps
  extends Omit<AriaTabsProps, 'className' | 'style' | 'children'>,
    Pick<ScreenProps, 'painter' | 'cols' | 'rows' | 'fallback'> {
  /** Which border set draws the frame; the theme's when not given. */
  readonly border?: BorderSetName;
  /** Padding inside the frame, in cells: one across by default, as `Frame` has. */
  readonly pad?: number | Inset;
  readonly className?: string;
  /** A `TabList` and its `TabPanel`s. */
  readonly children?: ReactNode;
}

const DEFAULT_PAD: Inset = { x: 1, y: 0 };

/** Views that share one place: the tab list in the top edge of the frame the panels fill. */
export function Tabs({
  border,
  pad,
  painter,
  cols,
  rows,
  fallback,
  className,
  children,
  ...aria
}: TabsProps): ReactNode {
  const inset =
    pad === undefined ? DEFAULT_PAD : typeof pad === 'number' ? { x: pad, y: pad } : pad;
  return (
    <AriaTabs {...aria} className={cx('rk-tabs', className)}>
      <TabsScreen
        {...(border === undefined ? {} : { border })}
        {...(painter === undefined ? {} : { painter })}
        {...(cols === undefined ? {} : { cols })}
        {...(rows === undefined ? {} : { rows })}
        {...(fallback === undefined ? {} : { fallback })}
        inset={inset}
      >
        {children}
      </TabsScreen>
    </AriaTabs>
  );
}

function TabsScreen({
  border,
  inset,
  children,
  ...screen
}: Pick<ScreenProps, 'painter' | 'cols' | 'rows' | 'fallback'> & {
  readonly border?: BorderSetName;
  readonly inset: Inset;
  readonly children?: ReactNode;
}): ReactNode {
  const state = useContext(TabListStateContext);
  const glyphs = useGlyphs();
  const keys = useMemo(() => (state ? [...state.collection.getKeys()] : []), [state]);
  const selected = state?.selectedKey ?? null;

  // Each label's width in cells, measured: a label is whatever it is given.
  const labels = useRef(new Map<Key, HTMLElement>());
  const [widths, setWidths] = useState<ReadonlyMap<Key, number>>(new Map());
  const remeasure = useCallback(() => {
    const next = new Map<Key, number>();
    for (const [key, el] of labels.current) {
      const screen = el.closest<HTMLElement>('.rk-screen');
      const cell = screen
        ? Number.parseFloat(getComputedStyle(screen).getPropertyValue('--rk-cell-width'))
        : Number.NaN;
      if (!Number.isFinite(cell) || cell <= 0) return;
      next.set(key, Math.ceil(el.getBoundingClientRect().width / cell - 0.05));
    }
    setWidths((was) =>
      was.size === next.size && [...next].every(([k, n]) => was.get(k) === n) ? was : next,
    );
  }, []);
  useIsomorphicLayoutEffect(() => {
    remeasure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => remeasure());
    for (const el of labels.current.values()) {
      observer.observe(el);
      const screen = el.closest('.rk-screen');
      if (screen) observer.observe(screen);
    }
    return () => observer.disconnect();
  });
  const measure = useCallback((key: Key, el: HTMLElement | null) => {
    if (el) labels.current.set(key, el);
    else labels.current.delete(key);
  }, []);

  const known = keys.every((k) => widths.has(k));
  const at = Math.max(0, keys.indexOf(selected as Key));

  const draw = useCallback(
    (size: Size) => {
      const layout = known
        ? layoutTabs(
            size.width,
            keys.map((k) => widths.get(k) ?? 0),
            at,
          )
        : { x: [], cols: [], before: false, after: false };
      return tabsBuffer(size, layout, border === undefined ? {} : { border }, glyphs);
    },
    [known, keys, widths, at, border, glyphs],
  );

  return (
    <Screen {...screen} draw={draw} className="rk-tabs-screen">
      {(size: Size) => {
        const layout = known
          ? layoutTabs(
              size.width,
              keys.map((k) => widths.get(k) ?? 0),
              at,
            )
          : undefined;
        // The panel fills the frame inside its border and padding, in whole cells.
        const style = {
          '--rk-tabs-panel-x': 1 + inset.x,
          '--rk-tabs-panel-y': 1 + inset.y,
          '--rk-tabs-panel-cols': Math.max(0, size.width - 2 * (1 + inset.x)),
          '--rk-tabs-panel-rows': Math.max(0, size.height - 2 * (1 + inset.y)),
        } as CSSProperties;
        return (
          <FrameContext.Provider value={{ layout, keys, measure }}>
            <div className="rk-tabs-body" style={style}>
              {children}
            </div>
          </FrameContext.Provider>
        );
      }}
    </Screen>
  );
}

export interface TabListProps<T extends object>
  extends Omit<AriaTabListProps<T>, 'className' | 'style'> {
  readonly className?: string;
}

/** The tabs, laid in the frame's top edge. Name it with `aria-label`. */
export function TabList<T extends object>({ className, ...aria }: TabListProps<T>): ReactNode {
  return <AriaTabList {...aria} className={cx('rk-tab-list', className)} />;
}

export interface TabProps extends Omit<AriaTabProps, 'className' | 'style' | 'children' | 'id'> {
  /** The tab's key: its `TabPanel` takes the same `id`. */
  readonly id: Key;
  readonly className?: string;
  /** The tab's label. */
  readonly children?: ReactNode;
}

/** A tab: its label in a gap in the top edge, reversed and bold when selected. */
export function Tab({ className, children, ...aria }: TabProps): ReactNode {
  // React Aria renders a tab from its collection, not from this function, so
  // anything that reads the frame has to be a component of its own inside it.
  return (
    <AriaTab {...aria} className={cx('rk-tab', className)}>
      <TabCells id={aria.id}>{children}</TabCells>
    </AriaTab>
  );
}

/**
 * The tab's label, and where the tab goes. It writes the tab's cells on the
 * tab element itself: the element is React Aria's, and this is inside it.
 */
function TabCells({
  id,
  children,
}: {
  readonly id: Key;
  readonly children?: ReactNode;
}): ReactNode {
  const frame = useContext(FrameContext);
  const label = useRef<HTMLSpanElement>(null);
  const index = frame === null ? -1 : frame.keys.indexOf(id);
  const x = index < 0 ? undefined : frame?.layout?.x[index];
  const cols = x === undefined ? 0 : (frame?.layout?.cols[index] ?? 0);
  useIsomorphicLayoutEffect(() => {
    const el = label.current;
    frame?.measure(id, el);
    return () => frame?.measure(id, null);
  }, [frame, id]);
  useIsomorphicLayoutEffect(() => {
    const tab = label.current?.closest<HTMLElement>('[role="tab"]');
    if (!tab) return;
    // A tab scrolled out of the edge keeps its element, so the keyboard can
    // still reach it, but no cells: it is drawn in again when it is selected.
    tab.style.setProperty('--rk-tab-x', String(x ?? 0));
    tab.style.setProperty('--rk-tab-cols', String(cols));
    tab.style.setProperty('--rk-tab-shown', x === undefined ? '0' : '1');
  }, [x, cols]);
  return (
    <span className="rk-tab-room">
      <span ref={label} className="rk-tab-label">
        {children}
      </span>
    </span>
  );
}

export interface TabPanelProps extends Omit<AriaTabPanelProps, 'className' | 'style'> {
  readonly className?: string;
}

/** A tab's view, inside the frame. */
export function TabPanel({ className, ...aria }: TabPanelProps): ReactNode {
  return <AriaTabPanel {...aria} className={cx('rk-tab-panel', className)} />;
}

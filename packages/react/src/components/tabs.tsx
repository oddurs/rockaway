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
 * theme's overflow marks at the ends. The focused tab is always shown, or
 * the selected one when focus is elsewhere. A tab whose label is text is
 * placed from the first render, on a server too.
 * The keyboard is React Aria's: arrows move between tabs, Home and End jump,
 * and selection follows focus unless activation is manual.
 */
import { type BorderSetName, type Size, stringWidth } from '@rockaway/grid';
import {
  Children,
  type CSSProperties,
  createContext,
  isValidElement,
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
import { useGlyphs } from '../glyphs.tsx';
import { type Inset, Screen, type ScreenProps } from '../screen.tsx';
import { layoutTabs, type TabsLayout, tabsBuffer } from './tabs.pure.ts';

/** What the frame tells each tab: where it goes, and how to report its label's width. */
interface TabsFrame {
  readonly layout: TabsLayout | undefined;
  readonly keys: readonly Key[];
  readonly measure: (key: Key, el: HTMLElement | null) => void;
}

const FrameContext = createContext<TabsFrame | null>(null);

/**
 * The frame's layout, for each tab's own element. React Aria builds a tab
 * from its collection, in a pass that runs before the frame knows its layout,
 * so `Tab` cannot read the layout when it runs: it is handed this box instead,
 * which `Tabs` makes above that pass, and which the frame fills as it renders,
 * before the tabs below it. The style the tab gives React Aria reads it when
 * the tab element renders, so a tab is placed on its first render, on a
 * server too.
 */
interface LayoutBox {
  current: Pick<TabsFrame, 'layout' | 'keys'> | null;
}

const LayoutBoxContext = createContext<LayoutBox | null>(null);

/** Where a tab goes, in cells, as the custom properties its stylesheet reads. */
function placement(frame: Pick<TabsFrame, 'layout' | 'keys'> | null, id: Key) {
  const index = frame === null ? -1 : frame.keys.indexOf(id);
  const x = index < 0 ? undefined : frame?.layout?.x[index];
  const cols = x === undefined ? 0 : (frame?.layout?.cols[index] ?? 0);
  // A tab scrolled out of the edge keeps its element, so the keyboard can
  // still reach it, but no cells: it is drawn in again when it is selected.
  return {
    '--rk-tab-x': String(x ?? 0),
    '--rk-tab-cols': String(cols),
    '--rk-tab-shown': x === undefined ? '0' : '1',
    '--rk-tab-clip': x === undefined ? 'inset(50%)' : 'none',
  };
}

/** A label's width in cells when it is text; undefined for anything else. */
function textCells(label: ReactNode): number | undefined {
  const items = Children.toArray(label);
  if (!items.every((item) => typeof item === 'string' || typeof item === 'number')) {
    return undefined;
  }
  return stringWidth(items.join(''));
}

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
  const [box] = useState<LayoutBox>(() => ({ current: null }));
  return (
    <LayoutBoxContext.Provider value={box}>
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
    </LayoutBoxContext.Provider>
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
  const box = useContext(LayoutBoxContext);
  const glyphs = useGlyphs();
  const keys = useMemo(() => (state ? [...state.collection.getKeys()] : []), [state]);
  const selected = state?.selectedKey ?? null;
  // The tab the window keeps in view: the focused one while the keyboard is in
  // the list, which under manual activation need not be the selected one
  // (0216), and the selected one otherwise.
  const focused = state?.selectionManager.isFocused ? state.selectionManager.focusedKey : null;
  const shown = focused ?? selected;

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

  // Before the page has measured, and on a server: a label that is text has
  // a width known without laying it out. Anything else waits for the measure.
  const guessed = useMemo(() => {
    const out = new Map<Key, number>();
    for (const key of keys) {
      const rendered = state?.collection.getItem(key)?.rendered;
      const label = isValidElement<{ children?: ReactNode }>(rendered)
        ? rendered.props.children
        : rendered;
      const cells = textCells(label);
      if (cells !== undefined) out.set(key, cells);
    }
    return out;
  }, [state, keys]);
  const widthOf = useCallback(
    (key: Key): number | undefined => widths.get(key) ?? guessed.get(key),
    [widths, guessed],
  );
  const known = keys.every((k) => widthOf(k) !== undefined);
  const at = Math.max(0, keys.indexOf(shown as Key));

  const draw = useCallback(
    (size: Size) => {
      const layout = known
        ? layoutTabs(
            size.width,
            keys.map((k) => widthOf(k) ?? 0),
            at,
          )
        : { x: [], cols: [], before: false, after: false };
      return tabsBuffer(size, layout, border === undefined ? {} : { border }, glyphs);
    },
    [known, keys, widthOf, at, border, glyphs],
  );

  return (
    <Screen {...screen} draw={draw} className="rk-tabs-screen">
      {(size: Size) => {
        const layout = known
          ? layoutTabs(
              size.width,
              keys.map((k) => widthOf(k) ?? 0),
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
        // Filled before the tabs below render, so each reads where it goes.
        if (box) box.current = { layout, keys };
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
  // anything that reads the frame has to be a component of its own inside it,
  // or read the layout box when the tab renders, as its style does.
  const box = useContext(LayoutBoxContext);
  return (
    <AriaTab
      {...aria}
      className={cx('rk-tab', className)}
      style={() => placement(box?.current ?? null, aria.id) as CSSProperties}
    >
      <TabCells id={aria.id}>{children}</TabCells>
    </AriaTab>
  );
}

/**
 * The tab's label, and where the tab goes after the first render. It writes
 * the tab's cells on the tab element itself: the element is React Aria's, and
 * this is inside it.
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
  const place = placement(frame, id);
  useIsomorphicLayoutEffect(() => {
    const el = label.current;
    frame?.measure(id, el);
    return () => frame?.measure(id, null);
  }, [frame, id]);
  // The tab's style places it when the tab renders. React Aria need not
  // render the tab again when only the layout changes, so this keeps it in
  // step: the same properties, written when the layout moves.
  const key = Object.values(place).join(' ');
  useIsomorphicLayoutEffect(() => {
    const tab = label.current?.closest<HTMLElement>('[role="tab"]');
    if (!tab) return;
    for (const [name, value] of Object.entries(place)) tab.style.setProperty(name, value);
  }, [key]);
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

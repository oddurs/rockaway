'use client';

/**
 * `List` (cairn 0100, 0133): the selection primitive a TUI leans on.
 *
 * A viewport that scrolls in whole rows, a cursor, selection, type-ahead, and a
 * scrollbar drawn in cells. The keyboard is React Aria's `ListBox` — arrows,
 * Home and End, the page keys and type-ahead all come from the library,
 * because a TUI is a keyboard-first thing and that is what React Aria is best
 * at.
 *
 * The cursor and the selection are two signals, drawn the way the state
 * vocabulary (0118) says, so a multi-select list can show which row the
 * keyboard is on and which rows are chosen at the same time:
 *
 *   - the cursor is the theme's cursor mark in a cell every row reserves
 *   - a selected row is reverse video, and under multi-select also carries the
 *     check mark in a second reserved cell
 *
 * Reserving the cells is what keeps both from moving anything: a row is the
 * same width whether it is under the cursor, chosen, both or neither.
 *
 * `listBuffer` draws the whole list as cells — rows, marks and scrollbar — and
 * `ListItem` draws its marks with the same function, so the list's text
 * snapshot is the component and not a picture of it.
 *
 * Virtualised by row (cairn 0115): React Aria's `Virtualizer` with a
 * `ListLayout` whose row height is the measured cell, so only the rows near
 * the viewport are in the page, every one on a whole cell. The keyboard is
 * still the collection's: Home, End, the page keys and type-ahead reach rows
 * that were never rendered. The scrollbar takes its count from the
 * collection, not from the page, so it shows the whole length.
 */
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
  ListBox,
  ListBoxItem,
  type ListBoxItemProps,
  type ListBoxProps,
  type ListBoxRenderProps,
  ListLayout,
  ListStateContext,
  Virtualizer,
} from 'react-aria-components';
import { DEFAULT_CELL, measureCell } from '../cell-metrics.ts';
import { cx } from '../cx.ts';
import { useGlyphs } from '../glyphs.tsx';
import { Chrome } from '../paint/chrome.tsx';
import { EMPTY, listMarks, scrollbarBuffer } from './list.pure.ts';

export interface ScrollbarState {
  /** Rows in the list. */
  readonly total: number;
  /** Rows the viewport shows. */
  readonly visible: number;
  /** The first visible row. */
  readonly offset: number;
}

/** What a row is showing, as React Aria reports it, in the vocabulary's words (0118). */
export interface ListRowState {
  /** The keyboard's row: `data-focused`, drawn as the cursor mark. */
  readonly cursor?: boolean;
  /** `data-selected`: reverse video, and the check mark under multi-select. */
  readonly selected?: boolean;
  /** `data-disabled`: dim. */
  readonly disabled?: boolean;
  /** `data-hovered`: the label underlined. */
  readonly hovered?: boolean;
}

/** A row to draw: its label, and its state. */
export interface ListRow extends ListRowState {
  readonly label: string;
}

export interface ListBufferOptions {
  readonly rows: readonly ListRow[];
  /** Cells across, the scrollbar's column included. */
  readonly width: number;
  /** Rows the viewport shows. */
  readonly visible: number;
  /** The first visible row. */
  readonly offset?: number;
  /** `selectionMode="multiple"`: every row reserves a second cell, for the check. */
  readonly multiple?: boolean;
  /** What an empty list says. */
  readonly empty?: string;
}

function Scrollbar({ state }: { state: ScrollbarState }): ReactNode {
  const glyphs = useGlyphs();
  const { total, visible, offset } = state;
  const buffer = useMemo(
    () => scrollbarBuffer({ total, visible, offset }, glyphs),
    [total, visible, offset, glyphs],
  );
  // Painted chrome, rendered rather than painted in an effect, so a server
  // sends it too (0126). A reader is told the list's position by the rows,
  // not by a column of blocks.
  return <Chrome buffer={buffer} className="rk-list-scrollbar" />;
}

/**
 * How a row tells the list how many rows the collection holds. Rows are drawn
 * inside React Aria's collection, which is the only place its size can be
 * read; the list itself is outside it.
 */
const RowCount = createContext<((count: number) => void) | null>(null);

/** Reports the collection's size from inside it. Draws nothing. */
function CountRows(): null {
  const state = useContext(ListStateContext);
  const report = useContext(RowCount);
  const size = state?.collection.size;
  useEffect(() => {
    if (size !== undefined) report?.(size);
  }, [size, report]);
  return null;
}

export interface ListProps<T extends object> extends Omit<ListBoxProps<T>, 'className' | 'style'> {
  /** How many rows the viewport shows. The list is exactly this tall. */
  readonly rows?: number;
  /**
   * Rows in the collection, for the scrollbar, when the collection does not
   * hold them all: a list that loads as it scrolls. Counted from the
   * collection otherwise.
   */
  readonly total?: number;
  /** What an empty list says, in its first row. `renderEmptyState` replaces it. */
  readonly empty?: ReactNode;
  readonly className?: string;
}

const DEFAULT_ROWS = 8;

/** Runs before paint in a browser, and not at all on a server. */
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export function List<T extends object>({
  rows = DEFAULT_ROWS,
  total,
  empty = EMPTY,
  renderEmptyState,
  className,
  children,
  ...list
}: ListProps<T>): ReactNode {
  const [offset, setOffset] = useState(0);
  const [count, setCount] = useState<number | undefined>(undefined);
  const report = useCallback((size: number) => setCount(size), []);

  // The scroll position, in whole rows from the top. Read with a native
  // listener rather than an onScroll prop, which would replace the one the
  // virtualiser passes this element: it would never learn the position, and
  // render the wrong rows.
  const box = useRef<HTMLDivElement>(null);
  const top = useRef(0);
  const height = useRef<number>(DEFAULT_CELL.height);
  // While the rows change height, the browser moves the scroll position on
  // its own (the content grows or shrinks under it); those moves are not the
  // reader's, and must not move the top row.
  const settling = useRef(false);

  // The row height is the cell's, measured the way Screen measures it, and
  // again whenever the list's box changes size: a new density changes the
  // line box, and the list is a number of rows tall, so its box changes too.
  // Measured before the first paint, and a fallback before that (and on a
  // server), so the virtualiser never lays out rows of no height and renders
  // the whole collection at once.
  const host = useRef<HTMLDivElement>(null);
  const [rowHeight, setRowHeight] = useState<number>(DEFAULT_CELL.height);
  useIsomorphicLayoutEffect(() => {
    const el = host.current;
    if (!el) return;
    const measure = (): void => {
      const next = measureCell(el).height;
      if (next === height.current) return;
      settling.current = true;
      height.current = next;
      setRowHeight(next);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const read = (): void => {
      if (settling.current) return;
      top.current = Math.round(el.scrollTop / height.current);
      setOffset(top.current);
    };
    read();
    el.addEventListener('scroll', read, { passive: true });
    return () => el.removeEventListener('scroll', read);
  }, []);

  // A new density makes every row a new height, and the same row stays at the
  // top, on a whole cell. Snapping is "proximity", so that a jump far past the
  // rendered rows is not pulled back to them, and proximity does not re-snap
  // after a change of layout the way "mandatory" does: so the list puts the
  // row back itself, once the rows have their new height.
  useIsomorphicLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    el.scrollTop = top.current * rowHeight;
    const frame = requestAnimationFrame(() => {
      el.scrollTop = top.current * rowHeight;
      settling.current = false;
    });
    return () => cancelAnimationFrame(frame);
  }, [rowHeight]);

  // Only the rows near the viewport are in the page (0115). The layout is in
  // whole cells, so a row lands on a whole cell however far down it is.
  const layout = useMemo(() => ({ rowHeight }), [rowHeight]);

  const glyphs = useGlyphs();
  const multiple = list.selectionMode === 'multiple';
  // The empty state keeps the rows' reserved cells, blank, so its words start
  // where every row's label does.
  const emptyState = (state: ListBoxRenderProps): ReactNode => (
    <div className="rk-list-empty">
      <EmptyCount />
      {listMarks({}, multiple, glyphs).map((mark, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: the cells are positions, not items
        <span key={i} aria-hidden="true" className="rk-list-mark">
          {mark}
        </span>
      ))}
      <span className="rk-list-label">{renderEmptyState ? renderEmptyState(state) : empty}</span>
    </div>
  );

  return (
    <RowCount.Provider value={report}>
      <div
        ref={host}
        className={cx('rk-list', className)}
        style={{ '--rk-list-rows': rows } as CSSProperties}
        // A pane, to the conformance levels: whole cells even at `loose` (0182).
        data-rk-pane=""
      >
        <Virtualizer layout={ListLayout} layoutOptions={layout}>
          <ListBox
            {...list}
            ref={box}
            className="rk-list-box rk-scroll"
            renderEmptyState={emptyState}
          >
            {children}
          </ListBox>
        </Virtualizer>
        <Scrollbar state={{ total: total ?? count ?? 0, visible: rows, offset }} />
      </div>
    </RowCount.Provider>
  );
}

/** An empty collection has no rows to count itself, so its empty state says so. */
function EmptyCount(): null {
  const report = useContext(RowCount);
  useEffect(() => report?.(0), [report]);
  return null;
}

export interface ListItemProps<T extends object> extends Omit<ListBoxItemProps<T>, 'className'> {
  readonly className?: string;
}

/**
 * A row: its reserved mark cells, then its label. The marks are hidden from
 * the reader, because "▸ src/index.ts" is not the name of anything.
 */
export function ListItem<T extends object>({
  className,
  children,
  ...item
}: ListItemProps<T>): ReactNode {
  const glyphs = useGlyphs();
  // The marks make the row's children a function, which React Aria cannot read
  // type-ahead from. A plain label is still the text to type, so say so.
  const text = item.textValue ?? (typeof children === 'string' ? children : undefined);
  return (
    <ListBoxItem
      {...item}
      {...(text === undefined ? {} : { textValue: text })}
      className={cx('rk-list-item', className)}
    >
      {(render) => {
        const [cursor, check] = listMarks(
          { cursor: render.isFocused, selected: render.isSelected },
          render.selectionMode === 'multiple',
          glyphs,
        );
        return (
          <>
            <CountRows />
            <span aria-hidden="true" className="rk-list-mark rk-list-cursor">
              {cursor}
            </span>
            {check === undefined ? null : (
              <span aria-hidden="true" className="rk-list-mark rk-list-check">
                {check}
              </span>
            )}
            <span className="rk-list-label">
              {typeof children === 'function' ? children(render) : children}
            </span>
          </>
        );
      }}
    </ListBoxItem>
  );
}

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
 * Not virtualised yet (cairn 0115). React Aria's `Virtualizer` renders only the
 * rows near the viewport, but a keyboard jump to a row it has not rendered —
 * `End`, or type-ahead across a long list — leaves focus nowhere, and a list
 * you cannot reach the end of is worse than one that renders too many rows.
 * The scrollbar is built for it either way: it takes the row count from the
 * collection, not from the DOM.
 */
import {
  type CSSProperties,
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
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
  ListStateContext,
} from 'react-aria-components';
import { measureCell } from '../cell-metrics.ts';
import { cx } from '../cx.ts';
import { useGlyphs } from '../glyphs.tsx';
import { Cells } from '../paint/render.tsx';
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
  return <Cells buffer={buffer} className="rk-list-scrollbar" />;
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

  // The scroll position, in rows. Read with a native listener rather than an
  // onScroll prop, which would replace the one React Aria passes this element.
  // The row height is measured when it is needed rather than assumed, because
  // density decides how tall a row is.
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const read = (): void => setOffset(Math.round(el.scrollTop / measureCell(el).height));
    read();
    el.addEventListener('scroll', read, { passive: true });
    return () => el.removeEventListener('scroll', read);
  }, []);

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
      <div className={cx('rk-list', className)} style={{ '--rk-list-rows': rows } as CSSProperties}>
        <ListBox
          {...list}
          ref={box}
          className="rk-list-box rk-scroll"
          renderEmptyState={emptyState}
        >
          {children}
        </ListBox>
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

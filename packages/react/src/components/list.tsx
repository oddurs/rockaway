/**
 * `List` (cairn 0100): the selection primitive a TUI leans on.
 *
 * A cursor, reverse-video selection, type-ahead, and a viewport that scrolls in
 * whole rows. The keyboard is React Aria's `ListBox` — arrows, home and end, the
 * page keys and type-ahead all come from the library, because a TUI is a
 * keyboard-first thing and that is what React Aria is best at.
 *
 * Two things are ours. Selection is a cursor glyph *and* reverse video, so it
 * survives forced colors, greyscale and a reader who cannot tell the accent from
 * the ground. And the scrollbar is drawn by the engine into a one-cell column,
 * which is why it can be snapshotted as text.
 *
 * Not virtualised yet (cairn 0115). React Aria's `Virtualizer` renders only the
 * rows near the viewport, which is what we want, but a keyboard jump to a row it
 * has not rendered — `End`, or type-ahead across a long list — leaves focus
 * nowhere, and a list you cannot reach the end of is worse than a list that
 * renders too many rows. The scrollbar is built for it either way: it takes the
 * row count, not the DOM.
 */
import { Buffer, drawText } from '@rockaway/grid';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import {
  ListBox,
  ListBoxItem,
  type ListBoxItemProps,
  type ListBoxProps,
} from 'react-aria-components';
import { measureCell } from '../cell-metrics.ts';
import { cx } from '../cx.ts';
import { paintGlyph } from '../paint/glyph.ts';

/** The glyphs a scrollbar is made of. A track, a thumb, and nothing else. */
const TRACK = '░';
const THUMB = '█';

export interface ScrollbarState {
  /** Rows in the list. */
  readonly total: number;
  /** Rows the viewport shows. */
  readonly visible: number;
  /** The first visible row. */
  readonly offset: number;
}

/**
 * The scrollbar as a buffer: one cell wide, as tall as the viewport. The thumb
 * is at least one cell, so a very long list still has something to grab, and it
 * lands on whole cells because there is nowhere else for it to land.
 */
export function scrollbarBuffer({ total, visible, offset }: ScrollbarState): Buffer {
  const rows = Math.max(0, visible);
  const buffer = Buffer.create({ width: 1, height: rows });
  if (rows === 0) return buffer;
  if (total <= visible) {
    // Nothing to scroll: a full-height thumb says so without a second glyph.
    return buffer.draw((draft) => {
      for (let y = 0; y < rows; y++) drawText(draft, { x: 0, y }, THUMB);
    });
  }

  const size = Math.max(1, Math.round((visible / total) * rows));
  const room = rows - size;
  const scrolled = total - visible;
  const start = scrolled <= 0 ? 0 : Math.round((offset / scrolled) * room);

  return buffer.draw((draft) => {
    for (let y = 0; y < rows; y++) {
      drawText(draft, { x: 0, y }, y >= start && y < start + size ? THUMB : TRACK);
    }
  });
}

function Scrollbar({ state }: { state: ScrollbarState }): ReactNode {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = host.current;
    if (el) paintGlyph(scrollbarBuffer(state), el);
  }, [state]);
  // Painted chrome: a reader is told the list's position by the rows, not by a
  // column of blocks.
  return <div ref={host} className="rk-list-scrollbar" aria-hidden="true" />;
}

export interface ListProps<T extends object> extends Omit<ListBoxProps<T>, 'className' | 'style'> {
  /** How many rows the viewport shows. The list is exactly this tall. */
  readonly rows?: number;
  /** Rows in the collection, for the scrollbar. Counted from the items if omitted. */
  readonly total?: number;
  readonly className?: string;
}

const DEFAULT_ROWS = 8;

export function List<T extends object>({
  rows = DEFAULT_ROWS,
  total,
  className,
  children,
  ...list
}: ListProps<T>): ReactNode {
  const host = useRef<HTMLDivElement>(null);
  const [cell, setCell] = useState(20);
  const [offset, setOffset] = useState(0);
  const [count, setCount] = useState(0);

  // The row height is the cell, measured rather than assumed, because the
  // scrollbar counts rows and density decides how tall a row is.
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const measure = (): void => setCell(measureCell(el).height);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // The scroll position is read with a native listener rather than an onScroll
  // prop: the virtualiser passes its own onScroll to this element, and a prop
  // here would replace it — then it never learns the scroll position, never
  // renders the row the keyboard moved to, and focus lands nowhere.
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const read = (): void => {
      setOffset(Math.round(el.scrollTop / cell));
      setCount(Math.round(el.scrollHeight / cell));
    };
    read();
    el.addEventListener('scroll', read, { passive: true });
    return () => el.removeEventListener('scroll', read);
  }, [cell]);

  const measured = total ?? (count === 0 ? rows : count);

  return (
    <div
      ref={host}
      className={cx('rk-list', className)}
      style={{ '--rk-list-rows': rows } as React.CSSProperties}
    >
      <ListBox {...list} ref={box} className="rk-list-box">
        {children}
      </ListBox>
      <Scrollbar state={{ total: measured, visible: rows, offset }} />
    </div>
  );
}

export interface ListItemProps<T extends object> extends Omit<ListBoxItemProps<T>, 'className'> {
  readonly className?: string;
}

/**
 * A row. The cursor is a glyph in its own cell, hidden from the reader, because
 * "▸ src/index.ts" is not the name of anything.
 */
export function ListItem<T extends object>({
  className,
  children,
  ...item
}: ListItemProps<T>): ReactNode {
  return (
    <ListBoxItem {...item} className={cx('rk-list-item', className)}>
      {(render) => (
        <>
          <span aria-hidden="true" className="rk-list-cursor">
            {render.isSelected || render.isFocused ? '▸' : ' '}
          </span>
          <span className="rk-list-label">
            {typeof children === 'function' ? children(render) : children}
          </span>
        </>
      )}
    </ListBoxItem>
  );
}

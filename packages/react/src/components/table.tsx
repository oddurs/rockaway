'use client';

/**
 * `Table` (cairn 0057): rows and columns, drawn the way a terminal draws them.
 *
 *   ┌──────────────┬────────┬────────────────┐
 *   │ Name        ▴│   Size │ Modified       │
 *   ├──────────────┼────────┼────────────────┤
 *   │▸src/index.ts │   1204 │ 2026-10-01     │
 *   │ README.md    │    340 │ 2026-09-12     │
 *   └──────────────┴────────┴────────────────┘
 *
 * One buffer draws the frame, the header rule and the column rules, and the
 * junction table resolves every seam: `┬` where a column rule meets the top,
 * `┼` where it crosses the header rule, `┴` at the bottom, `├ ┤` where the
 * header rule meets the sides. Nothing here picks a corner. The cells are a
 * real table laid over the chrome, so a reader gets React Aria's grid: the
 * arrows move between cells, Space selects, Enter sorts a focused header, and
 * every cell is announced with its column.
 *
 * Columns are whole cells. A column is a cell of air (or, in the first, the
 * row's reserved mark cells), its content, and a cell after it that holds the
 * sort mark in the header. Content widths are cells (`width={12}`), shares of
 * what is left (`'1fr'`), or as wide as the widest value (`'auto'`, the
 * default), solved by the layout solver (0081). Text longer than its column is
 * cut on a grapheme with the theme's ellipsis, never past the rule; wide
 * characters are two cells; numbers right-align with `align="end"`.
 *
 * States, per 0118, none of which moves a cell:
 *
 *   - cursor: the cursor mark in the first reserved cell of the focused row
 *   - selected: reverse video; under multi-select, the check in a second cell
 *   - sorted: the theme's sort mark in the header's reserved cell, and
 *     `aria-sort` for a reader
 *   - hover underlines a row's text; disabled dims it; focus on a header or a
 *     cell is the ring
 *
 * A table wider than the room it has keeps its columns and scrolls across in
 * whole columns, its overflow marked; nothing else scrolls.
 */
import {
  Attr,
  type BorderSetName,
  Buffer,
  borderSets,
  type Draft,
  drawBox,
  drawText,
  fixed,
  grow,
  rect,
  type Size,
  type Style,
  solve,
  stringWidth,
  type Track,
  truncate,
} from '@rockaway/grid';
import { type Glyphs, marks } from '@rockaway/tokens';
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
  Cell as AriaCell,
  type CellProps as AriaCellProps,
  Column as AriaColumn,
  type ColumnProps as AriaColumnProps,
  Row as AriaRow,
  type RowProps as AriaRowProps,
  Table as AriaTable,
  TableBody as AriaTableBody,
  type TableBodyProps as AriaTableBodyProps,
  TableHeader as AriaTableHeader,
  type TableHeaderProps as AriaTableHeaderProps,
  type TableProps as AriaTableProps,
  TableStateContext,
  VisuallyHidden,
} from 'react-aria-components';
import { cellsIn, measureCell } from '../cell-metrics.ts';
import { cx } from '../cx.ts';
import { defaultGlyphs, useGlyphs } from '../glyphs.tsx';
import { type PainterName, Screen } from '../screen.tsx';
import { watchOverflowMarks } from '../scroll.ts';
import { drawRule } from './divider.pure.ts';

/** How wide a column's content is: cells, a share of what is left, or its widest value. */
export type ColumnWidth = number | 'auto' | `${number}fr`;

export type ColumnAlign = 'start' | 'end';

export type SortDirection = 'ascending' | 'descending';

export type SelectionMode = 'none' | 'single' | 'multiple';

/** A column as the layout sees it. */
export interface ColumnShape {
  /** The header's words. */
  readonly header: string;
  /** `'auto'` unless given: as wide as the widest value or the header. */
  readonly width?: ColumnWidth;
  /** The fewest content cells a share column may shrink to. */
  readonly minWidth?: number;
  readonly align?: ColumnAlign;
  /** Reserves the header's last cell for the sort mark. */
  readonly sortable?: boolean;
}

/** A solved table: every column's content width, and where everything sits. */
export interface TableLayout {
  /** Content cells per column. */
  readonly content: readonly number[];
  /** Cells before each column's content: the air, or the row's mark cells. */
  readonly lead: readonly number[];
  /** Each column's whole track: lead, content, and the cell after it. */
  readonly tracks: readonly number[];
  /** Where each column rule is, in cells from the frame's left edge. */
  readonly rules: readonly number[];
  /** The frame's width: border, tracks and rules. */
  readonly width: number;
  /** True when the columns could not fit the room given, and the table scrolls. */
  readonly overflows: boolean;
}

/** Cells reserved at the start of every row: the cursor's, and the check's under multi-select. */
export function markCells(selectionMode: SelectionMode = 'none'): number {
  return selectionMode === 'multiple' ? 2 : 1;
}

function shareOf(width: ColumnWidth | undefined): number | undefined {
  if (typeof width !== 'string' || !width.endsWith('fr')) return undefined;
  const weight = Number.parseFloat(width);
  return Number.isFinite(weight) && weight > 0 ? weight : 1;
}

/**
 * Solves the columns in whole cells. `values` are each column's widest value
 * in cells, for `auto`. `room` is the frame's width; left out, every share
 * column takes its minimum and the table is as narrow as it can be.
 */
export function tableLayout(
  columns: readonly ColumnShape[],
  values: readonly number[],
  options: { readonly room?: number; readonly selectionMode?: SelectionMode } = {},
): TableLayout {
  const lead = columns.map((_, i) => (i === 0 ? markCells(options.selectionMode) : 1));
  const chrome =
    2 + Math.max(0, columns.length - 1) + lead.reduce((a, b) => a + b, 0) + columns.length;
  const tracks: Track[] = columns.map((column, i) => {
    const header = stringWidth(column.header);
    const share = shareOf(column.width);
    if (share !== undefined) {
      return grow(share, { min: Math.max(1, column.minWidth ?? Math.min(header, 4)) });
    }
    if (typeof column.width === 'number') return fixed(Math.max(1, Math.trunc(column.width)));
    return fixed(Math.max(1, header, values[i] ?? 0));
  });
  const natural = solve(
    0,
    tracks.map((t) => (t.kind === 'grow' ? fixed(t.min ?? 1) : t)),
  );
  const narrowest = natural.overflow;
  const room = options.room === undefined ? narrowest : options.room - chrome;
  const solved = solve(Math.max(room, narrowest), tracks);
  const content = solved.sizes;
  const sizes = content.map((cells, i) => (lead[i] ?? 1) + cells + 1);
  // The left border is cell 0; each track follows the one before and its rule.
  const rules: number[] = [];
  let x = 1;
  sizes.forEach((size, i) => {
    x += size;
    if (i < sizes.length - 1) {
      rules.push(x);
      x += 1;
    }
  });
  const width = 2 + sizes.reduce((a, b) => a + b, 0) + Math.max(0, sizes.length - 1);
  return {
    content,
    lead,
    tracks: sizes,
    rules,
    width,
    overflows: options.room !== undefined && room < narrowest,
  };
}

/** The line's style: the ordinary edge, as Frame draws it. */
const LINE: Style = { fg: 'border.default', attrs: Attr.none };
const TITLE: Style = { fg: 'fg.default', attrs: Attr.none };

/**
 * The chrome: the frame, the header rule and the column rules. The rules are
 * edges, so the junction table makes every crossing; a title in the top edge
 * stops short of the first `┬` (0175).
 */
function drawChrome(
  draft: Draft,
  size: Size,
  layout: TableLayout,
  options: { readonly title?: string; readonly border?: BorderSetName; readonly empty?: boolean },
  glyphs: Glyphs,
): void {
  const border = options.border ?? glyphs.borderSet;
  const set = borderSets[border];
  drawBox(draft, rect(0, 0, size.width, size.height), {
    set,
    style: LINE,
    titleStyle: TITLE,
    ellipsis: set.ascii ? marks.ascii.ellipsis : glyphs.mark.ellipsis,
    ...(options.title === undefined ? {} : { title: options.title }),
  });
  if (size.height > 3) drawRule(draft, rect(0, 2, size.width, 1), { border }, glyphs);
  // An empty body is one row of words across the table, so the column rules
  // stop at the header rule rather than run through it.
  const down = options.empty ? Math.min(3, size.height) : size.height;
  for (const x of layout.rules) {
    if (x > 0 && x < size.width - 1) {
      drawRule(draft, rect(x, 0, 1, down), { border, orientation: 'vertical' }, glyphs);
    }
  }
}

/** A row as text. */
export interface RowText {
  readonly cells: readonly string[];
  /** The keyboard's row: the cursor mark. */
  readonly cursor?: boolean;
  readonly selected?: boolean;
  readonly disabled?: boolean;
}

/** A table as text: what `tableBuffer` draws. */
export interface TableText {
  readonly columns: readonly (ColumnShape & { readonly sort?: SortDirection })[];
  readonly rows: readonly RowText[];
  /** Set into the top edge. */
  readonly title?: string;
  /** The room the table has, in cells; as narrow as it can be when not given. */
  readonly width?: number;
  readonly selectionMode?: SelectionMode;
  readonly border?: BorderSetName;
  /** What an empty table says. */
  readonly empty?: string;
}

/** A value laid into its column: cut with the theme's ellipsis, and aligned. */
export function fitCell(
  text: string,
  width: number,
  align: ColumnAlign = 'start',
  glyphs: Glyphs = defaultGlyphs,
): string {
  const cut = truncate(text, width, glyphs.mark.ellipsis);
  const spare = Math.max(0, width - stringWidth(cut));
  return align === 'end' ? ' '.repeat(spare) + cut : cut + ' '.repeat(spare);
}

/** The marks at the start of a row: the cursor's cell, and under multi-select the check's. */
export function rowMarks(
  row: Pick<RowText, 'cursor' | 'selected'>,
  selectionMode: SelectionMode = 'none',
  glyphs: Glyphs = defaultGlyphs,
): string {
  const cursor = row.cursor ? glyphs.mark.cursor : glyphs.mark.blank;
  if (selectionMode !== 'multiple') return cursor;
  return cursor + (row.selected ? glyphs.mark.check : glyphs.mark.blank);
}

/** The header's last cell: the sort mark, or blank. */
export function sortMark(sort: SortDirection | undefined, glyphs: Glyphs = defaultGlyphs): string {
  if (sort === 'ascending') return glyphs.mark['sort-ascending'];
  if (sort === 'descending') return glyphs.mark['sort-descending'];
  return glyphs.mark.blank;
}

const EMPTY = 'Nothing here.';

/** The widest value in each column, in cells. */
function widest(columns: number, rows: readonly RowText[]): number[] {
  return Array.from({ length: columns }, (_, i) =>
    Math.max(0, ...rows.map((row) => stringWidth(row.cells[i] ?? ''))),
  );
}

/** How tall a table is: the frame, the header, its rule, and a row each (or one, empty). */
export function tableHeight(rows: number): number {
  return 4 + Math.max(1, rows);
}

/**
 * The whole table as cells: chrome, header, rows and marks. Its text
 * snapshot, and the model a story holds the page to. The attributes are
 * `table.css`'s, restated: reverse video for a selected row, dim for a
 * disabled one, the header muted.
 */
export function tableBuffer(table: TableText, glyphs: Glyphs = defaultGlyphs): Buffer {
  const mode = table.selectionMode ?? 'none';
  const layout = tableLayout(table.columns, widest(table.columns.length, table.rows), {
    ...(table.width === undefined ? {} : { room: table.width }),
    selectionMode: mode,
  });
  const size = { width: layout.width, height: tableHeight(table.rows.length) };
  return Buffer.create(size).draw((draft) => {
    drawChrome(
      draft,
      size,
      layout,
      {
        ...(table.title === undefined ? {} : { title: table.title }),
        ...(table.border === undefined ? {} : { border: table.border }),
        empty: table.rows.length === 0,
      },
      glyphs,
    );
    const starts = columnStarts(layout);
    const header: Style = { fg: 'fg.muted', attrs: Attr.none };
    table.columns.forEach((column, i) => {
      const x = starts[i] ?? 1;
      const lead = layout.lead[i] ?? 1;
      const content = layout.content[i] ?? 0;
      drawText(draft, { x, y: 1 }, ' '.repeat(lead), { style: header });
      drawText(
        draft,
        { x: x + lead, y: 1 },
        fitCell(column.header, content, column.align, glyphs),
        {
          style: header,
        },
      );
      drawText(draft, { x: x + lead + content, y: 1 }, sortMark(column.sort, glyphs), {
        style: header,
      });
    });
    if (table.rows.length === 0) {
      const lead = layout.lead[0] ?? 1;
      drawText(draft, { x: 1 + lead, y: 3 }, table.empty ?? EMPTY, {
        maxWidth: layout.width - 2 - lead,
        ellipsis: glyphs.mark.ellipsis,
        style: { fg: 'fg.muted', attrs: Attr.none },
      });
    }
    table.rows.forEach((row, r) => {
      const y = 3 + r;
      let attrs = Attr.none;
      if (row.selected) attrs |= Attr.reverse;
      if (row.disabled) attrs |= Attr.dim;
      const style: Style = { fg: row.disabled ? 'fg.disabled' : 'fg.default', attrs };
      table.columns.forEach((column, i) => {
        const x = starts[i] ?? 1;
        const lead = layout.lead[i] ?? 1;
        const content = layout.content[i] ?? 0;
        const marksText = i === 0 ? rowMarks(row, mode, glyphs) : ' ';
        drawText(draft, { x, y }, marksText, { style });
        drawText(
          draft,
          { x: x + lead, y },
          fitCell(row.cells[i] ?? '', content, column.align, glyphs),
          {
            style,
          },
        );
        drawText(draft, { x: x + lead + content, y }, ' ', { style });
      });
    });
  });
}

/** Where each column's track starts, in cells from the frame's left edge. */
function columnStarts(layout: TableLayout): number[] {
  const starts: number[] = [];
  let x = 1;
  for (const track of layout.tracks) {
    starts.push(x);
    x += track + 1;
  }
  return starts;
}

/** The chrome alone, for the screen under the real table. */
export function tableChromeBuffer(
  size: Size,
  layout: TableLayout,
  options: {
    readonly title?: string;
    readonly border?: BorderSetName;
    readonly empty?: boolean;
  } = {},
  glyphs: Glyphs = defaultGlyphs,
): Buffer {
  return Buffer.create(size).draw((draft) => {
    drawChrome(draft, size, layout, options, glyphs);
  });
}

// ── The component ──────────────────────────────────────────────────────────

/** What the cells and headers need from the table: the solved columns, and the marks. */
interface Layout {
  readonly layout: TableLayout;
  readonly aligns: readonly ColumnAlign[];
  readonly selectionMode: SelectionMode;
  /** How the table learns its columns, from inside React Aria's collection. */
  readonly report: (shape: Measured) => void;
}

const LayoutContext = createContext<Layout | null>(null);

/** What the collection says about the columns and rows. */
interface Measured {
  readonly columns: readonly ColumnShape[];
  readonly values: readonly number[];
  readonly rows: number;
}

const sameMeasure = (a: Measured | undefined, b: Measured): boolean =>
  a !== undefined && JSON.stringify(a) === JSON.stringify(b);

/** The props a column passes through React Aria, so the table can read them off the collection. */
const WIDTH = 'data-rk-width';
const MIN = 'data-rk-min-width';
const ALIGN = 'data-rk-align';

/**
 * Reads the columns and rows from React Aria's collection and reports them
 * to the table. It lives inside a column header, because only inside the
 * collection can the collection be read (React Aria renders its items from
 * the collection, not from the wrappers around them).
 */
function Measure(): null {
  const state = useContext(TableStateContext);
  const layout = useContext(LayoutContext);
  const collection = state?.collection;
  useEffect(() => {
    if (!collection || !layout) return;
    const columns = collection.columns.map((node): ColumnShape => {
      const props = node.props as Record<string, unknown>;
      const width = props[WIDTH] as ColumnWidth | undefined;
      const min = props[MIN] as number | undefined;
      const align = props[ALIGN] as ColumnAlign | undefined;
      return {
        header: node.textValue,
        ...(width === undefined ? {} : { width }),
        ...(min === undefined ? {} : { minWidth: min }),
        ...(align === undefined ? {} : { align }),
        sortable: props.allowsSorting === true,
      };
    });
    const values = columns.map(() => 0);
    let rows = 0;
    for (const row of collection.rows) {
      rows += 1;
      for (const cell of collection.getChildren?.(row.key) ?? []) {
        const at = cell.colIndex ?? cell.index;
        values[at] = Math.max(values[at] ?? 0, stringWidth(cell.textValue));
      }
    }
    layout.report({ columns, values, rows });
  });
  return null;
}

/** A cell's words, when they are words: what its column is as wide as. */
function textOf(node: unknown): string {
  return typeof node === 'string' || typeof node === 'number' ? String(node) : '';
}

/**
 * The columns and rows, read from the elements the table is given rather than
 * from React Aria's collection. The collection can only be read inside it,
 * after the table has drawn its frame, and only in an effect, which a server
 * never runs: without this, a page with no script, or the first paint before
 * hydration, drew a frame with no columns, and no room for its title. It reads
 * what `Measure` reads, in the same shape, so the client's first measurement
 * agrees with it and nothing moves when it arrives. A collection it cannot
 * read this way (columns from a function) is left to `Measure`.
 */
function staticMeasure(children: ReactNode): Measured | undefined {
  const columns: ColumnShape[] = [];
  const values: number[] = [];
  let rows = 0;
  const visit = (node: ReactNode): void => {
    Children.forEach(node, (child) => {
      if (!isValidElement(child)) return;
      const props = child.props as Record<string, unknown>;
      if (child.type === Column) {
        const min = props.minWidth as number | undefined;
        columns.push({
          header: textOf(props.children),
          width: (props.width as ColumnWidth | undefined) ?? 'auto',
          ...(min === undefined ? {} : { minWidth: min }),
          align: (props.align as ColumnAlign | undefined) ?? 'start',
          sortable: props.allowsSorting === true,
        });
        return;
      }
      if (child.type === Row) {
        rows += 1;
        let at = 0;
        Children.forEach(props.children as ReactNode, (cell) => {
          if (!isValidElement(cell) || cell.type !== Cell) return;
          const words = textOf((cell.props as { children?: unknown }).children);
          values[at] = Math.max(values[at] ?? 0, stringWidth(words));
          at += 1;
        });
        return;
      }
      const kids = props.children;
      if (typeof kids === 'function') {
        // A body of items, rendered by a function: each item's row.
        const items = props.items as Iterable<unknown> | undefined;
        if (child.type === TableBody && items !== undefined) {
          for (const item of items) visit((kids as (item: unknown) => ReactNode)(item));
        }
        return;
      }
      visit(kids as ReactNode);
    });
  };
  visit(children);
  if (columns.length === 0) return undefined;
  return { columns, values: columns.map((_, i) => values[i] ?? 0), rows };
}

export interface TableProps extends Omit<AriaTableProps, 'className' | 'style' | 'children'> {
  /** Set into the frame's top edge; the table's accessible name unless `aria-label` says otherwise. */
  readonly title?: string;
  /**
   * The room the table has, in cells, its frame included. Measured from its
   * container when not given. A table whose columns do not fit scrolls.
   */
  readonly cols?: number;
  readonly border?: BorderSetName;
  readonly painter?: PainterName;
  readonly className?: string;
  /** A TableHeader and a TableBody. */
  readonly children?: ReactNode;
}

/**
 * Rows and columns of data in a frame, with column rules that join the header
 * rule. React Aria's `Table`: keyboard grid navigation, sorting, selection.
 */
export function Table({
  title,
  cols,
  border,
  painter = 'glyph',
  className,
  children,
  selectionMode = 'none',
  ...aria
}: TableProps): ReactNode {
  const glyphs = useGlyphs();
  // Read from the elements first, so a server, and the first paint, draw the
  // real columns and the title; React Aria's collection confirms it after.
  const [measured, setMeasured] = useState<Measured | undefined>(() => staticMeasure(children));
  const report = useCallback(
    (next: Measured) => setMeasured((now) => (sameMeasure(now, next) ? now : next)),
    [],
  );

  // The room: given, or the container's width in cells.
  const host = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState<number | undefined>(cols);
  useLayoutEffect(() => {
    if (cols !== undefined) {
      setRoom(cols);
      return;
    }
    const el = host.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const read = (): void => {
      const cell = measureCell(el);
      setRoom(cellsIn(el.getBoundingClientRect().width, cell.width));
    };
    read();
    const observer = new ResizeObserver(read);
    observer.observe(el);
    return () => observer.disconnect();
  }, [cols]);

  const mode = selectionMode as SelectionMode;
  const layout = useMemo(
    () =>
      tableLayout(measured?.columns ?? [], measured?.values ?? [], {
        ...(room === undefined ? {} : { room }),
        selectionMode: mode,
      }),
    [measured, room, mode],
  );
  const rows = measured?.rows ?? 0;
  const size = { width: layout.width, height: tableHeight(rows) };

  // Its overflow marks, where the stylesheet cannot show them itself (0218).
  const overflows = layout.overflows;
  useEffect(() => {
    const region = host.current;
    if (!overflows || !region) return;
    return watchOverflowMarks(region);
  }, [overflows]);

  const draw = useMemo(
    () => (at: Size) =>
      tableChromeBuffer(
        at,
        layout,
        {
          ...(title === undefined ? {} : { title }),
          ...(border === undefined ? {} : { border }),
          empty: rows === 0,
        },
        glyphs,
      ),
    [layout, title, border, glyphs, rows],
  );

  const context = useMemo<Layout>(
    () => ({
      layout,
      aligns: (measured?.columns ?? []).map((c) => c.align ?? 'start'),
      selectionMode: mode,
      report,
    }),
    [layout, measured, mode, report],
  );

  const template = layout.tracks
    .map(
      (track, i) =>
        `calc(var(--rk-cell-width) * ${track + (i < layout.tracks.length - 1 ? 1 : 0)})`,
    )
    .join(' ');
  const name = aria['aria-label'] ?? title;

  return (
    <div
      ref={host}
      className={cx(
        'rk-table',
        layout.overflows && 'rk-scroll rk-scroll-marks rk-table-scrolls',
        className,
      )}
      // A table wider than its room scrolls across, a column at a time.
      {...(layout.overflows
        ? {
            'data-rk-offgrid':
              'a table wider than its screen scrolls across, and snaps to its columns',
            tabIndex: -1,
          }
        : {})}
    >
      <Screen
        draw={draw}
        cols={size.width}
        rows={size.height}
        painter={painter}
        contentInset={{ x: 1, y: 1 }}
        className="rk-table-screen"
      >
        <LayoutContext.Provider value={context}>
          <AriaTable
            {...aria}
            {...(name === undefined ? {} : { 'aria-label': name })}
            selectionMode={selectionMode}
            className="rk-table-grid"
            style={{ '--rk-table-columns': template } as CSSProperties}
          >
            {children}
          </AriaTable>
        </LayoutContext.Provider>
      </Screen>
    </div>
  );
}

export interface TableHeaderProps<T extends object>
  extends Omit<AriaTableHeaderProps<T>, 'className'> {
  readonly className?: string;
}

/** The header row: one `Column` per column. */
export function TableHeader<T extends object>({
  className,
  ...aria
}: TableHeaderProps<T>): ReactNode {
  return <AriaTableHeader {...aria} className={cx('rk-table-header', className)} />;
}

export interface ColumnProps
  extends Omit<AriaColumnProps, 'children' | 'className' | 'width' | 'minWidth' | 'textValue'> {
  /** The header's words. */
  readonly children: string;
  /** Content cells (`12`), a share of the room left (`'1fr'`), or its widest value (`'auto'`). */
  readonly width?: ColumnWidth;
  /** The fewest content cells a share column shrinks to. */
  readonly minWidth?: number;
  /** `end` for numbers: they right-align on a cell boundary. */
  readonly align?: ColumnAlign;
  readonly className?: string;
}

/** A column header: its words, cut to its width, and its sort mark. */
export function Column({
  children,
  width = 'auto',
  minWidth,
  align = 'start',
  className,
  ...aria
}: ColumnProps): ReactNode {
  const extra = {
    [WIDTH]: width,
    [ALIGN]: align,
    ...(minWidth === undefined ? {} : { [MIN]: minWidth }),
  };
  return (
    <AriaColumn
      {...aria}
      {...extra}
      textValue={children}
      className={cx('rk-table-column', className)}
    >
      {({ sortDirection, allowsSorting }) => (
        <>
          <Measure />
          <HeaderContent text={children} sort={sortDirection} sortable={allowsSorting} />
        </>
      )}
    </AriaColumn>
  );
}

/** The column index of the cell this element is in, read off the page once it is there. */
function useCellIndex(): [React.RefObject<HTMLSpanElement | null>, number | undefined] {
  const ref = useRef<HTMLSpanElement>(null);
  const [index, setIndex] = useState<number | undefined>(undefined);
  useLayoutEffect(() => {
    const cell = ref.current?.closest('th, td') as HTMLTableCellElement | null;
    if (cell) setIndex(cell.cellIndex);
  }, []);
  return [ref, index];
}

function HeaderContent({
  text,
  sort,
  sortable,
}: {
  readonly text: string;
  readonly sort: SortDirection | undefined;
  readonly sortable: boolean;
}): ReactNode {
  const glyphs = useGlyphs();
  const context = useContext(LayoutContext);
  const state = useContext(TableStateContext);
  const [ref, measuredIndex] = useCellIndex();
  // Before the page can say which column this is (on a server, and in the
  // first paint), the collection can, by the header's words.
  const found = state?.collection.columns.findIndex((node) => node.textValue === text) ?? -1;
  const index = measuredIndex ?? (found < 0 ? undefined : found);
  const lead = index === undefined ? 1 : (context?.layout.lead[index] ?? 1);
  const width = index === undefined ? undefined : context?.layout.content[index];
  const align = index === undefined ? 'start' : (context?.aligns[index] ?? 'start');
  const fitted = width === undefined ? text : fitCell(text, width, align, glyphs);
  return (
    <span ref={ref} className={cx('rk-table-cell-inner', sortable && 'rk-table-sortable')}>
      <span aria-hidden="true" className="rk-table-lead">
        {' '.repeat(lead)}
      </span>
      <Words text={text} fitted={fitted} />
      <span aria-hidden="true" className="rk-table-sort">
        {sortable ? sortMark(sort, glyphs) : glyphs.mark.blank}
      </span>
    </span>
  );
}

/**
 * A value as drawn and as heard. Cut to its column, the drawn form hides the
 * rest; a reader is given the whole of it.
 */
function Words({ text, fitted }: { readonly text: string; readonly fitted: string }): ReactNode {
  if (fitted.trim() === text.trim()) {
    return (
      <span className="rk-table-content">
        <span className="rk-table-value">{fitted}</span>
      </span>
    );
  }
  return (
    <span className="rk-table-content">
      <span aria-hidden="true" className="rk-table-value">
        {fitted}
      </span>
      <VisuallyHidden elementType="span">{text}</VisuallyHidden>
    </span>
  );
}

export interface TableBodyProps<T extends object> extends Omit<AriaTableBodyProps<T>, 'className'> {
  /** What an empty table says, in its first row. `renderEmptyState` replaces it. */
  readonly empty?: string;
  readonly className?: string;
}

/** The rows. */
export function TableBody<T extends object>({
  empty = EMPTY,
  renderEmptyState,
  className,
  ...aria
}: TableBodyProps<T>): ReactNode {
  return (
    <AriaTableBody
      {...aria}
      className={cx('rk-table-body', className)}
      renderEmptyState={(state) => (
        <span className="rk-table-empty">
          <EmptyLead />
          {renderEmptyState ? renderEmptyState(state) : empty}
        </span>
      )}
    />
  );
}

/** An empty body's words start where every row's content does. */
function EmptyLead(): ReactNode {
  const context = useContext(LayoutContext);
  return (
    <span aria-hidden="true" className="rk-table-lead">
      {' '.repeat(context?.layout.lead[0] ?? 1)}
    </span>
  );
}

export interface RowProps<T extends object> extends Omit<AriaRowProps<T>, 'className'> {
  readonly className?: string;
}

/** A row: a `Cell` per column. Selected rows reverse; the focused one carries the cursor. */
export function Row<T extends object>({ className, ...aria }: RowProps<T>): ReactNode {
  return <AriaRow {...aria} className={cx('rk-table-row', className)} />;
}

export interface CellProps extends Omit<AriaCellProps, 'children' | 'className' | 'textValue'> {
  /** The value. Text and numbers are cut and aligned in cells; anything else is clipped at the rule. */
  readonly children?: ReactNode;
  readonly className?: string;
}

/** A value in a row. */
export function Cell({ children, className, ...aria }: CellProps): ReactNode {
  const text =
    typeof children === 'string'
      ? children
      : typeof children === 'number'
        ? String(children)
        : undefined;
  return (
    <AriaCell
      {...aria}
      {...(text === undefined ? {} : { textValue: text })}
      className={cx('rk-table-cell', className)}
    >
      {({ columnIndex, id, isSelected }) => (
        <CellContent
          index={columnIndex ?? 0}
          cell={id}
          selected={isSelected}
          {...(text === undefined ? { node: children } : { text })}
        />
      )}
    </AriaCell>
  );
}

function CellContent({
  index,
  cell,
  selected,
  text,
  node,
}: {
  readonly index: number;
  readonly cell: unknown;
  readonly selected: boolean;
  readonly text?: string;
  readonly node?: ReactNode;
}): ReactNode {
  const glyphs = useGlyphs();
  const context = useContext(LayoutContext);
  const state = useContext(TableStateContext);
  const mode = context?.selectionMode ?? 'none';
  const lead = context?.layout.lead[index] ?? 1;
  const width = context?.layout.content[index];
  const align = context?.aligns[index] ?? 'start';

  let marksText = ' '.repeat(lead);
  if (index === 0) {
    // The cursor is the focused row's, whether the row or one of its cells has focus.
    const manager = state?.selectionManager;
    const focused = manager?.focusedKey;
    const row = state?.collection.getItem(cell as never)?.parentKey;
    const cursor =
      manager?.isFocused === true &&
      focused !== null &&
      focused !== undefined &&
      (focused === row || state?.collection.getItem(focused)?.parentKey === row);
    marksText = rowMarks({ cursor, selected }, mode, glyphs);
  }

  return (
    <span className="rk-table-cell-inner">
      <span aria-hidden="true" className="rk-table-lead">
        {marksText}
      </span>
      {text === undefined ? (
        <span className="rk-table-content rk-table-content-node">{node}</span>
      ) : (
        <Words
          text={text}
          fitted={width === undefined ? text : fitCell(text, width, align, glyphs)}
        />
      )}
      <span aria-hidden="true" className="rk-table-trail">
        {glyphs.mark.blank}
      </span>
    </span>
  );
}

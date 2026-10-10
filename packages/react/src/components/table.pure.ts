/**
 * `Table`: the pure half (cairn 0057, 0126).
 *
 * The column solver, the chrome, a value fitted to its column, a row's marks
 * and the whole table as cells. No React and no client boundary, so a server
 * component, a static renderer or a test can call them; `table.tsx` imports
 * them from here.
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
import { type Glyphs, marks, themeGlyphs } from '@rockaway/tokens';
import { drawRule } from './divider.pure.ts';
import type {
  ColumnAlign,
  ColumnShape,
  ColumnWidth,
  RowText,
  SelectionMode,
  SortDirection,
  TableLayout,
  TableText,
} from './table.tsx';

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

/** A value laid into its column: cut with the theme's ellipsis, and aligned. */
export function fitCell(
  text: string,
  width: number,
  align: ColumnAlign = 'start',
  glyphs: Glyphs = themeGlyphs.default,
): string {
  const cut = truncate(text, width, glyphs.mark.ellipsis);
  const spare = Math.max(0, width - stringWidth(cut));
  return align === 'end' ? ' '.repeat(spare) + cut : cut + ' '.repeat(spare);
}

/** The marks at the start of a row: the cursor's cell, and under multi-select the check's. */
export function rowMarks(
  row: Pick<RowText, 'cursor' | 'selected'>,
  selectionMode: SelectionMode = 'none',
  glyphs: Glyphs = themeGlyphs.default,
): string {
  const cursor = row.cursor ? glyphs.mark.cursor : glyphs.mark.blank;
  if (selectionMode !== 'multiple') return cursor;
  return cursor + (row.selected ? glyphs.mark.check : glyphs.mark.blank);
}

/** The header's last cell: the sort mark, or blank. */
export function sortMark(
  sort: SortDirection | undefined,
  glyphs: Glyphs = themeGlyphs.default,
): string {
  if (sort === 'ascending') return glyphs.mark['sort-ascending'];
  if (sort === 'descending') return glyphs.mark['sort-descending'];
  return glyphs.mark.blank;
}

/** What an empty table says unless it is told otherwise. */
export const EMPTY: string = 'Nothing here.';

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
export function tableBuffer(table: TableText, glyphs: Glyphs = themeGlyphs.default): Buffer {
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
  glyphs: Glyphs = themeGlyphs.default,
): Buffer {
  return Buffer.create(size).draw((draft) => {
    drawChrome(draft, size, layout, options, glyphs);
  });
}

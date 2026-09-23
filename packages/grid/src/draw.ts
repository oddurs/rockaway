/**
 * Drawing (cairn 0082): boxes, lines, titles and text.
 *
 * Nothing here writes a box character directly. Every border sets edge weights
 * on the cells it touches and asks the junction model what glyph that makes,
 * which is why a divider meeting a frame becomes `├` without either of them
 * knowing about the other.
 */
import type { Cell, Draft, Edges, Weight } from './buffer.ts';
import { bottom, type Point, type Rect, rect, right } from './geometry.ts';
import { type BorderSet, borderSets, glyphFor, mergeEdges } from './junction.ts';
import { EMPTY_STYLE, type Style } from './style.ts';
import { clusterWidth, graphemes, stringWidth, truncate } from './text.ts';

export interface DrawOptions {
  readonly set?: BorderSet;
  readonly style?: Style;
}

export interface BoxOptions extends DrawOptions {
  /** Set into the top edge, truncated to what the edge can hold. */
  readonly title?: string;
  readonly titleAlign?: 'start' | 'center' | 'end';
  readonly titleStyle?: Style;
}

const NONE: Edges = { north: 0, east: 0, south: 0, west: 0 };

/** Add edges to a cell and redraw whatever glyph that makes. */
export function addEdges(
  draft: Draft,
  point: Point,
  edges: Partial<Edges>,
  options: DrawOptions = {},
): void {
  const set = options.set ?? borderSets.single;
  const current = draft.edgesAt(point);
  if (!current) return;
  const merged = mergeEdges(current, { ...NONE, ...edges });
  draft.setEdges(point, merged);
  const ch = glyphFor(merged, set);
  if (ch !== undefined) {
    draft.set(point, { ch, style: options.style ?? EMPTY_STYLE, width: 1 });
  }
}

const weightOf = (options: DrawOptions): Weight => (options.set ?? borderSets.single).weight;

/** A horizontal line. Length is in cells, and includes the starting cell. */
export function drawHLine(
  draft: Draft,
  from: Point,
  length: number,
  options: DrawOptions = {},
): void {
  const w = weightOf(options);
  for (let i = 0; i < length; i++) {
    const point = { x: from.x + i, y: from.y };
    addEdges(draft, point, { west: i === 0 ? 0 : w, east: i === length - 1 ? 0 : w }, options);
  }
}

/** A vertical line. */
export function drawVLine(
  draft: Draft,
  from: Point,
  length: number,
  options: DrawOptions = {},
): void {
  const w = weightOf(options);
  for (let i = 0; i < length; i++) {
    const point = { x: from.x, y: from.y + i };
    addEdges(draft, point, { north: i === 0 ? 0 : w, south: i === length - 1 ? 0 : w }, options);
  }
}

/**
 * A box around `area`: the border sits on the outermost cells, so the content
 * is `inset(area, 1)`.
 */
export function drawBox(draft: Draft, area: Rect, options: BoxOptions = {}): void {
  if (area.width < 2 || area.height < 2) return;
  const w = weightOf(options);
  const x0 = area.x;
  const y0 = area.y;
  const x1 = right(area) - 1;
  const y1 = bottom(area) - 1;

  for (let x = x0; x <= x1; x++) {
    addEdges(draft, { x, y: y0 }, { west: x === x0 ? 0 : w, east: x === x1 ? 0 : w }, options);
    addEdges(draft, { x, y: y1 }, { west: x === x0 ? 0 : w, east: x === x1 ? 0 : w }, options);
  }
  for (let y = y0; y <= y1; y++) {
    addEdges(draft, { x: x0, y }, { north: y === y0 ? 0 : w, south: y === y1 ? 0 : w }, options);
    addEdges(draft, { x: x1, y }, { north: y === y0 ? 0 : w, south: y === y1 ? 0 : w }, options);
  }

  if (options.title !== undefined && options.title !== '') {
    drawTitle(draft, area, options);
  }
}

function drawTitle(draft: Draft, area: Rect, options: BoxOptions): void {
  // The corners and one cell of border either side stay, so the title never
  // runs into them: `┌─ title ──┐`.
  const room = area.width - 4;
  if (room <= 0) return;
  const text = ` ${truncate(options.title ?? '', room - 2)} `;
  const width = stringWidth(text);
  const spare = area.width - 2 - width;
  const align = options.titleAlign ?? 'start';
  const offset =
    align === 'start'
      ? 1
      : align === 'end'
        ? Math.max(1, area.width - 1 - width)
        : Math.max(1, Math.floor(spare / 2) + 1);
  drawText(draft, { x: area.x + offset, y: area.y }, text, {
    style: options.titleStyle ?? options.style ?? EMPTY_STYLE,
    maxWidth: area.width - 2,
  });
}

export interface TextOptions {
  readonly style?: Style;
  /** Truncate to this many cells, ellipsis included. */
  readonly maxWidth?: number;
}

/**
 * Write text at a point. A wide character takes its cell and the one after it,
 * so the grid never drifts by half a character.
 */
export function drawText(draft: Draft, at: Point, text: string, options: TextOptions = {}): number {
  const style = options.style ?? EMPTY_STYLE;
  const content = options.maxWidth === undefined ? text : truncate(text, options.maxWidth);
  let x = at.x;
  for (const cluster of graphemes(content)) {
    const width = clusterWidth(cluster);
    if (width === 0) continue;
    const cell: Cell = { ch: cluster, style, width };
    draft.set({ x, y: at.y }, cell);
    if (width === 2) draft.set({ x: x + 1, y: at.y }, { ch: '', style, width: 0 });
    x += width;
  }
  return x - at.x;
}

/** Fill an area with one character, leaving edges alone. */
export function fillArea(draft: Draft, area: Rect, ch: string, style: Style = EMPTY_STYLE): void {
  draft.fill(area, { ch, style, width: clusterWidth(ch) === 2 ? 2 : 1 });
}

/** A divider inside a box: it stops at the walls and joins them. */
export function drawDivider(
  draft: Draft,
  area: Rect,
  atRow: number,
  options: DrawOptions = {},
): void {
  if (area.width < 2) return;
  drawHLine(draft, { x: area.x, y: atRow }, area.width, options);
}

/** A box split into columns by vertical dividers at the given offsets. */
export function drawColumnRules(
  draft: Draft,
  area: Rect,
  offsets: readonly number[],
  options: DrawOptions = {},
): void {
  for (const offset of offsets) {
    drawVLine(draft, { x: area.x + offset, y: area.y }, area.height, options);
  }
}

/** The area inside a box's border. */
export function contentArea(area: Rect, padding = 0): Rect {
  const inner = rect(
    area.x + 1,
    area.y + 1,
    Math.max(0, area.width - 2),
    Math.max(0, area.height - 2),
  );
  if (padding === 0) return inner;
  return rect(
    inner.x + padding,
    inner.y + padding,
    Math.max(0, inner.width - padding * 2),
    Math.max(0, inner.height - padding * 2),
  );
}

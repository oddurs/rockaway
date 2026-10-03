/**
 * Labels in an edge (cairn 0175): a frame's title, a rule's label.
 *
 * A label is text laid over border cells, and a rule drawn into the same edge
 * meets it: `┌ title ┬──┐`. Drawn as plain text, whichever came second won —
 * a junction drawn after the title replaced a letter (`┌ singl┬ ─┐`), a title
 * drawn after the junction replaced the tee and broke the rule.
 *
 * So a label is not written when it is drawn. It is recorded, and set into its
 * edge when the draw pass closes, once every edge in the pass is known: it owns
 * the cells it sits in, never the cells where a rule crosses its edge, and it
 * truncates before the first such junction, the way a pane title does in tmux.
 * The junction still resolves from the edges, so the order things were drawn
 * in still does not matter.
 */
import type { Cell, Draft } from './buffer.ts';
import type { Rect } from './geometry.ts';
import { type BorderSet, glyphFor } from './junction.ts';
import { EMPTY_STYLE, type Style } from './style.ts';
import { clusterWidth, graphemes, stringWidth, truncate } from './text.ts';

export type LabelAlign = 'start' | 'center' | 'end';

export interface LabelOptions {
  readonly align?: LabelAlign;
  /** The label's own style. */
  readonly style?: Style;
  /** What the edge is drawn in, for the cells a label gives back. */
  readonly lineStyle?: Style;
  /** What a truncated label ends with. A theme drawing in ASCII cannot use `…`. */
  readonly ellipsis?: string;
  /** The set the edge is drawn with, for the cells a label gives back. */
  readonly set: BorderSet;
}

/** A label waiting to be set into its edge. */
export interface Label {
  /** The edge, one row tall, its two ends included: a frame's corners, a rule's ends. */
  readonly line: Rect;
  readonly text: string;
  readonly options: LabelOptions;
  /** What it wrote last time it was set, so it can give those cells back. */
  readonly written: readonly (readonly [x: number, cell: Cell])[];
}

/**
 * Set `text` into a horizontal edge, `line`. Nothing is written until the
 * draw pass closes; then the label takes the segment of the edge its alignment
 * points at — from the start to the first junction, from the last junction to
 * the end, or the segment under the middle — and truncates to fit it.
 */
export function drawLabel(draft: Draft, line: Rect, text: string, options: LabelOptions): void {
  if (text === '' || line.width < 1) return;
  draft.addLabel({ line, text, options, written: [] });
}

const sameCell = (a: Cell | undefined, b: Cell): boolean =>
  a !== undefined && a.ch === b.ch && a.width === b.width && a.style === b.style;

/**
 * Set one label into its edge as the edge now stands, giving back whatever it
 * wrote the last time. Run for every label when a draw pass closes.
 */
export function setLabel(draft: Draft, label: Label): Label {
  const { line, options } = label;
  const y = line.y;

  // Give back the cells it wrote, unless something has since been drawn over
  // them: a junction drawn into a letter keeps its cell.
  for (const [x, cell] of label.written) {
    if (!sameCell(draft.at({ x, y }), cell)) continue;
    const ch = glyphFor(draft.edgesAt({ x, y }) ?? NONE, options.set) ?? ' ';
    draft.set({ x, y }, { ch, style: options.lineStyle ?? EMPTY_STYLE, width: 1 });
  }

  // A junction is any cell inside the edge that a line crosses.
  const first = line.x;
  const last = line.x + line.width - 1;
  const stops = [first];
  for (let x = first + 1; x < last; x++) {
    const e = draft.edgesAt({ x, y });
    if (e && (e.north !== 0 || e.south !== 0)) stops.push(x);
  }
  stops.push(last);

  const [from, to] = segment(stops, options.align ?? 'start', first + Math.floor(line.width / 2));
  const width = to - from + 1;
  // The ends stay, and at least one cell of edge between the label and the far
  // end, so a label never runs into a corner or a junction: `╭ rounded ─╮`.
  // The label is the text with a space either side. One too narrow to show a
  // single character is not drawn at all, rather than as a gap in the edge.
  const fitted = truncate(label.text, width - 5, options.ellipsis);
  if (fitted === '') return { ...label, written: [] };
  const text = ` ${fitted} `;
  const used = stringWidth(text);
  const align = options.align ?? 'start';
  const offset =
    align === 'start'
      ? 1
      : align === 'end'
        ? Math.max(1, width - 1 - used)
        : Math.max(1, Math.floor((width - used) / 2));

  const style = options.style ?? EMPTY_STYLE;
  const written: [number, Cell][] = [];
  let x = from + offset;
  for (const cluster of graphemes(text)) {
    const w = clusterWidth(cluster);
    if (w === 0) continue;
    if (x + w - 1 >= to) break;
    const cell: Cell = { ch: cluster, style, width: w };
    draft.set({ x, y }, cell);
    written.push([x, cell]);
    if (w === 2) {
      const rest: Cell = { ch: '', style, width: 0 };
      draft.set({ x: x + 1, y }, rest);
      written.push([x + 1, rest]);
    }
    x += w;
  }
  return { ...label, written };
}

const NONE = { north: 0, east: 0, south: 0, west: 0 } as const;

/**
 * The pair of stops a label sits between. `start` takes the first segment and
 * `end` the last; `center` takes the one under the middle of the edge, or the
 * one just before it when a junction is the middle.
 */
function segment(stops: readonly number[], align: LabelAlign, middle: number): [number, number] {
  const pairs = stops.slice(1).map((to, i) => [stops[i] as number, to] as [number, number]);
  if (align === 'start') return pairs[0] as [number, number];
  if (align === 'end') return pairs.at(-1) as [number, number];
  return (pairs.find(([a, b]) => middle > a && middle < b) ??
    pairs.findLast(([, b]) => b <= middle) ??
    pairs[0]) as [number, number];
}

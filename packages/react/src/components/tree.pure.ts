/**
 * `Tree`: the pure half (cairn 0126).
 *
 * A row's guides, marks and style, and the tree as cells. No React and no
 * client boundary, so a server, a static renderer or a test can call it;
 * `tree.tsx` imports it from here.
 */
import {
  Attr,
  addEdges,
  Buffer,
  type Draft,
  drawText,
  type Edges,
  borderSets as engineSets,
  type Style,
} from '@rockaway/grid';
import type { Glyphs } from '@rockaway/tokens';
import { themeGlyphs } from '@rockaway/tokens';

/** Where a row sits: how deep, whether it and each row above it is the last of its siblings. */
export interface TreeLineage {
  /** 1 at the top. */
  readonly level: number;
  /**
   * From the second level down to the row itself: whether that row is the last
   * of its siblings. An ancestor that is not the last draws `│` past this row;
   * the row draws `└─` if it is the last, `├─` if not.
   */
  readonly last: readonly boolean[];
}

/** The cells of air the guides leave per level. */
const LEVEL = 2;

/**
 * A row's guides as a buffer: two cells per level below the top, the
 * ancestors' lines and then the row's own tee or corner, all as edges the
 * junction table turns into glyphs. A leaf below the top level gets one more
 * cell, the guide carried through its expand cell to the label: `├──`.
 */
export function treeGuides(
  { level, last }: TreeLineage,
  leaf: boolean,
  glyphs: Glyphs = themeGlyphs.default,
): Buffer {
  const depth = Math.max(0, level - 1);
  const width = depth * LEVEL + (leaf && depth > 0 ? 1 : 0);
  const set = engineSets[glyphs.borderSet];
  const line: Style = { fg: 'fg.muted', attrs: Attr.none };
  const edges = (draft: Draft, x: number, e: Partial<Edges>): void =>
    addEdges(draft, { x, y: 0 }, e, { set, style: line });
  return Buffer.create({ width, height: 1 }).draw((draft) => {
    for (let d = 0; d < depth; d++) {
      const x = d * LEVEL;
      const isLast = last[d] ?? true;
      if (d < depth - 1) {
        // An ancestor's line runs past this row while it has siblings to come.
        if (!isLast) edges(draft, x, { north: 1, south: 1 });
        continue;
      }
      // The row's own tee, or its corner if it is the last.
      edges(draft, x, { north: 1, east: 1, ...(isLast ? {} : { south: 1 }) });
      edges(draft, x + 1, { west: 1, east: 1 });
      if (leaf) edges(draft, x + 2, { west: 1, east: 1 });
    }
  });
}

/** What a row is showing, in the vocabulary's words (0118). */
export interface TreeRowState {
  readonly cursor?: boolean;
  readonly selected?: boolean;
  readonly disabled?: boolean;
  readonly hovered?: boolean;
  readonly expanded?: boolean;
}

/** A row to draw: where it sits, whether it has children, its label and its state. */
export interface TreeRow extends TreeRowState, TreeLineage {
  readonly label: string;
  /** It has children, so it carries the expand mark. */
  readonly branch?: boolean;
}

export interface TreeBufferOptions {
  readonly rows: readonly TreeRow[];
  /** Cells across. A label that does not fit is cut, ending in the theme's ellipsis. */
  readonly width: number;
  /** `selectionMode="multiple"`: every row reserves a second cell, for the check. */
  readonly multiple?: boolean;
}

/** The reserved cells at the start of a row: the cursor's, and the check's under multi-select. */
export function treeMarks(
  state: TreeRowState,
  multiple: boolean,
  glyphs: Glyphs = themeGlyphs.default,
): readonly string[] {
  const cursor = state.cursor ? glyphs.mark.cursor : glyphs.mark.blank;
  if (!multiple) return [cursor];
  return [cursor, state.selected ? glyphs.mark.check : glyphs.mark.blank];
}

/** The expand cell's mark for a row with children; nothing for a leaf. */
export function treeExpandMark(
  branch: boolean,
  expanded: boolean,
  glyphs: Glyphs = themeGlyphs.default,
): string | undefined {
  if (!branch) return undefined;
  return expanded ? glyphs.mark.expanded : glyphs.mark.collapsed;
}

/** A row's style: what `tree.css` draws for its state, as cell attributes. */
export function treeRowStyle(state: TreeRowState): Style {
  let attrs = Attr.none;
  if (state.selected) attrs |= Attr.reverse;
  if (state.disabled) attrs |= Attr.dim;
  return { fg: state.disabled ? 'fg.disabled' : 'fg.default', attrs };
}

/**
 * The tree as cells: every row's reserved marks, guides, expand cell, air and
 * label, in the row's style. This is the text snapshot; the component draws
 * its guides with `treeGuides` and its marks with `treeMarks`, the functions
 * this calls.
 */
export function treeBuffer(
  { rows, width, multiple = false }: TreeBufferOptions,
  glyphs: Glyphs = themeGlyphs.default,
): Buffer {
  const reserved = multiple ? 2 : 1;
  return Buffer.create({ width, height: rows.length }).draw((draft) => {
    rows.forEach((row, y) => {
      const style = treeRowStyle(row);
      for (let x = 0; x < width; x++) drawText(draft, { x, y }, ' ', { style });
      treeMarks(row, multiple, glyphs).forEach((mark, x) => {
        drawText(draft, { x, y }, mark, { style });
      });
      const leaf = !row.branch;
      const guides = treeGuides(row, leaf, glyphs);
      for (let x = 0; x < guides.width; x++) {
        const cell = guides.at({ x, y: 0 });
        if (cell && cell.ch !== ' ')
          draft.set(
            { x: reserved + x, y },
            { ...cell, style: { ...cell.style, attrs: style.attrs } },
          );
      }
      let x = reserved + guides.width;
      const mark = treeExpandMark(!leaf, row.expanded ?? false, glyphs);
      if (mark !== undefined || row.level <= 1) {
        if (mark !== undefined) drawText(draft, { x, y }, mark, { style });
        x += 1;
      }
      x += 1;
      const label: Style = row.hovered ? { ...style, attrs: style.attrs | Attr.underline } : style;
      drawText(draft, { x, y }, row.label, {
        maxWidth: Math.max(0, width - x),
        ellipsis: glyphs.mark.ellipsis,
        style: label,
      });
    });
  });
}

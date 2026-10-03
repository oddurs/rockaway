'use client';

/**
 * `Tree` (cairn 0137): a hierarchy you can expand and collapse. A file tree,
 * and the site's navigation.
 *
 * Its rows behave like List's: the theme's cursor mark in a cell every row
 * reserves, reverse video for selection and, under multi-select, the check in
 * a second reserved cell (0118). Depth is drawn as tree guides, and the guides
 * are geometry: each row's are a buffer the junction table draws, `├─`, `└─`
 * and `│`, so a guide is edges on a cell, joined to the row above and below by
 * the cell renderer, and never characters typed into a label.
 *
 *   ▾ src
 *   ├─▾ components
 *   │ ├── button.tsx
 *   │ └── list.tsx
 *   └── index.ts
 *
 * Each level is two cells, so indentation is whole cells by construction. A
 * row is, in order: the cursor cell, the check cell under multi-select, the
 * guides, the expand cell, a cell of air, and the label. The expand cell holds
 * `▾` or `▸` for a row with children, the guide's last stroke for a leaf, and
 * nothing for a leaf at the top. The cursor is first, where List puts it, and
 * not beside the expand mark, because in the default theme the cursor and the
 * collapsed mark are the same glyph and only their place tells them apart.
 *
 * Behaviour is React Aria's `Tree`: arrows move, right expands, left collapses
 * or goes to the parent, Home and End, type-ahead, and `href` items that
 * navigate on Enter or a press. The expand mark is React Aria's chevron button,
 * so pressing it expands the row and never follows its link. Guides and marks
 * are `aria-hidden`; the level, the expanded state and the position in the set
 * are the treegrid's to announce.
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
import { type CSSProperties, createContext, type ReactNode, useContext } from 'react';
import {
  Tree as AriaTree,
  TreeItem as AriaTreeItem,
  type TreeItemProps as AriaTreeItemProps,
  type TreeProps as AriaTreeProps,
  Button,
  TreeItemContent,
  type TreeItemContentRenderProps,
} from 'react-aria-components';
import { cx } from '../cx.ts';
import { defaultGlyphs, useGlyphs } from '../glyphs.tsx';
import { rowRuns, type StrokeStyle } from '../paint/cells.ts';

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
  glyphs: Glyphs = defaultGlyphs,
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
  glyphs: Glyphs = defaultGlyphs,
): readonly string[] {
  const cursor = state.cursor ? glyphs.mark.cursor : glyphs.mark.blank;
  if (!multiple) return [cursor];
  return [cursor, state.selected ? glyphs.mark.check : glyphs.mark.blank];
}

/** The expand cell's mark for a row with children; nothing for a leaf. */
export function treeExpandMark(
  branch: boolean,
  expanded: boolean,
  glyphs: Glyphs = defaultGlyphs,
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
  glyphs: Glyphs = defaultGlyphs,
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

/** Which stroke the guides are drawn with, set on the tree and read by its rows. */
const Strokes = createContext<StrokeStyle>('glyph');

export interface TreeProps<T extends object> extends Omit<AriaTreeProps<T>, 'className' | 'style'> {
  /** How the guides are stroked: weighted like type, or hairlines. Match the screen it sits in. */
  readonly painter?: StrokeStyle;
  readonly className?: string;
  readonly style?: CSSProperties;
}

export function Tree<T extends object>({
  painter = 'glyph',
  className,
  style,
  ...tree
}: TreeProps<T>): ReactNode {
  return (
    <Strokes.Provider value={painter}>
      <AriaTree
        {...tree}
        className={cx('rk-tree', className)}
        {...(style === undefined ? {} : { style })}
      />
    </Strokes.Provider>
  );
}

/** A row's place in the collection: its level, and which of it and its ancestors are last. */
function lineageOf(render: TreeItemContentRenderProps): TreeLineage {
  const { collection } = render.state;
  const isLast = (key: unknown): boolean => {
    let node = collection.getItem(key as never);
    let next = node?.nextKey == null ? null : collection.getItem(node.nextKey);
    while (next != null && next.type !== 'item') {
      next = next.nextKey == null ? null : collection.getItem(next.nextKey);
    }
    node = next;
    return node == null;
  };
  const last: boolean[] = [];
  let node = collection.getItem(render.id);
  while (node != null && render.level > 1 && last.length < render.level - 1) {
    last.unshift(isLast(node.key));
    node = node.parentKey == null ? null : collection.getItem(node.parentKey);
  }
  return { level: render.level, last };
}

/** A row's guides, as runs of cells: the painter's own runs, so they stroke as painted chrome does. */
function Guides({ buffer }: { buffer: Buffer }): ReactNode {
  const strokes = useContext(Strokes);
  if (buffer.width === 0) return null;
  let col = 0;
  return (
    <span aria-hidden="true" className="rk-tree-guides" data-rk-painted={strokes}>
      {rowRuns(buffer, 0).map((run) => {
        const at = col;
        col += run.cells;
        return (
          <span
            key={at}
            className="rk-run"
            {...(run.shape === undefined ? {} : { 'data-rk-shape': run.shape })}
            style={{ '--rk-col': at, '--rk-run': run.cells } as CSSProperties}
          >
            {run.text}
          </span>
        );
      })}
    </span>
  );
}

export interface TreeItemProps<T extends object>
  extends Omit<AriaTreeItemProps<T>, 'className' | 'children' | 'textValue'> {
  /** The row's label, and the text type-ahead matches. */
  readonly title: string;
  /** What type-ahead matches, when it is not the title. */
  readonly textValue?: string;
  /** The rows under this one. A row with children carries the expand mark. */
  readonly children?: ReactNode;
  readonly className?: string;
}

/**
 * A row, and the rows under it. React Aria draws rows from its collection, not
 * from this component, so everything that reads the row's place does it inside
 * React Aria's content, where the collection is.
 */
export function TreeItem<T extends object>({
  title,
  textValue,
  children,
  className,
  ...item
}: TreeItemProps<T>): ReactNode {
  const glyphs = useGlyphs();
  return (
    <AriaTreeItem
      {...item}
      textValue={textValue ?? title}
      className={cx('rk-tree-item', className)}
    >
      <TreeItemContent>
        {(render) => {
          const lineage = lineageOf(render);
          const leaf = !render.hasChildItems;
          const multiple = render.selectionMode === 'multiple';
          const [cursor, check] = treeMarks(
            { cursor: render.isFocused, selected: render.isSelected },
            multiple,
            glyphs,
          );
          const mark = treeExpandMark(!leaf, render.isExpanded, glyphs);
          return (
            <>
              <span aria-hidden="true" className="rk-tree-mark rk-tree-cursor">
                {cursor}
              </span>
              {check === undefined ? null : (
                <span aria-hidden="true" className="rk-tree-mark rk-tree-check">
                  {check}
                </span>
              )}
              <Guides buffer={treeGuides(lineage, leaf, glyphs)} />
              {mark !== undefined ? (
                // React Aria's chevron: it expands and collapses, and never
                // follows the row's link. Its name comes from React Aria.
                <Button slot="chevron" className="rk-tree-mark rk-tree-chevron">
                  <span aria-hidden="true">{mark}</span>
                </Button>
              ) : lineage.level <= 1 ? (
                <span aria-hidden="true" className="rk-tree-mark" />
              ) : null}
              <span aria-hidden="true" className="rk-tree-mark" />
              <span className="rk-tree-label">{title}</span>
            </>
          );
        }}
      </TreeItemContent>
      {children}
    </AriaTreeItem>
  );
}

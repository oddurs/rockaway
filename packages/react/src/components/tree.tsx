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
 *
 * `NavigationTree` is the same rows for a site's navigation (cairn 0104): each
 * label is a real link, so a row opens in a new tab and works with no script,
 * and the page you are on is the selected row, in reverse video and
 * `aria-current`. Its keyboard is React Aria's NavigationTree.
 */
import type { Buffer } from '@rockaway/grid';
import { type CSSProperties, createContext, type ReactNode, useContext } from 'react';
import {
  Link as AriaLink,
  NavigationTree as AriaNavigationTree,
  NavigationTreeItem as AriaNavigationTreeItem,
  type NavigationTreeItemProps as AriaNavigationTreeItemProps,
  type NavigationTreeProps as AriaNavigationTreeProps,
  Tree as AriaTree,
  TreeItem as AriaTreeItem,
  type TreeItemProps as AriaTreeItemProps,
  type TreeProps as AriaTreeProps,
  Button,
  NavigationTreeItemContent,
  TreeItemContent,
  type TreeItemContentRenderProps,
} from 'react-aria-components';
import { cx } from '../cx.ts';
import { useGlyphs } from '../glyphs.tsx';
import { rowRuns, type StrokeStyle } from '../paint/cells.ts';
import { type TreeLineage, treeExpandMark, treeGuides, treeMarks } from './tree.pure.ts';

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
function lineageOf(render: RowRender): TreeLineage {
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

/** What a row needs from React Aria to draw itself, from either tree. */
type RowRender = Pick<
  TreeItemContentRenderProps,
  'id' | 'level' | 'state' | 'hasChildItems' | 'isExpanded' | 'isSelected' | 'selectionMode'
>;

/**
 * A row's cells, in order: cursor, check, guides, expand, air, label. Shared
 * by both trees, so a navigation row is a file row whose label is a link.
 */
function Row({
  render,
  cursor: isCursor,
  label,
}: {
  readonly render: RowRender;
  readonly cursor: boolean;
  readonly label: ReactNode;
}): ReactNode {
  const glyphs = useGlyphs();
  const lineage = lineageOf(render);
  const leaf = !render.hasChildItems;
  const multiple = render.selectionMode === 'multiple';
  const [cursor, check] = treeMarks(
    { cursor: isCursor, selected: render.isSelected },
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
      {label}
    </>
  );
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
  return (
    <AriaTreeItem
      {...item}
      textValue={textValue ?? title}
      className={cx('rk-tree-item', className)}
    >
      <TreeItemContent>
        {(render) => (
          <Row
            render={render}
            cursor={render.isFocused}
            label={<span className="rk-tree-label">{title}</span>}
          />
        )}
      </TreeItemContent>
      {children}
    </AriaTreeItem>
  );
}

export interface NavigationTreeProps<T extends object>
  extends Omit<AriaNavigationTreeProps<T>, 'className' | 'style' | 'selectedRoute'> {
  /** The page you are on, as the `href` of its row: drawn in reverse video, and `aria-current`. */
  readonly current?: string;
  /** How the guides are stroked: weighted like type, or hairlines. Match the screen it sits in. */
  readonly painter?: StrokeStyle;
  readonly className?: string;
  readonly style?: CSSProperties;
}

/**
 * A site's navigation: the same rows as `Tree`, whose labels are links. Each
 * label is an `a` with its `href`, so a row opens in a new tab, copies as a
 * link and works before any script has run. The keyboard is React Aria's
 * NavigationTree: Tab into the tree, and arrows between its links.
 */
export function NavigationTree<T extends object>({
  current,
  painter = 'glyph',
  className,
  style,
  ...tree
}: NavigationTreeProps<T>): ReactNode {
  return (
    <Strokes.Provider value={painter}>
      <AriaNavigationTree
        {...tree}
        selectedRoute={current ?? null}
        className={cx('rk-tree', className)}
        {...(style === undefined ? {} : { style })}
      />
    </Strokes.Provider>
  );
}

export interface NavigationTreeItemProps<T extends object>
  extends Omit<AriaNavigationTreeItemProps<T>, 'className' | 'children' | 'textValue' | 'style'> {
  /** The row's label, the link's text, and what type-ahead matches. */
  readonly title: string;
  /** Where the row goes. */
  readonly href: string;
  /** The rows under this one. A row with children carries the expand mark. */
  readonly children?: ReactNode;
  readonly className?: string;
}

/** A row of a `NavigationTree`: its label a link to `href`, and the rows under it. */
export function NavigationTreeItem<T extends object>({
  title,
  children,
  className,
  ...item
}: NavigationTreeItemProps<T>): ReactNode {
  return (
    <AriaNavigationTreeItem {...item} textValue={title} className={cx('rk-tree-item', className)}>
      <NavigationTreeItemContent>
        {(render) => (
          <Row
            render={render}
            // Focus rests on the row's link rather than the row: either is the cursor.
            cursor={render.isFocused || render.isFocusVisible}
            label={<AriaLink className="rk-tree-label">{title}</AriaLink>}
          />
        )}
      </NavigationTreeItemContent>
      {children}
    </AriaNavigationTreeItem>
  );
}

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
 * navigate on Enter or a press. `disallowTypeAhead` gives the printable keys
 * back to the page, for a tree that sits in a keymap of single-letter
 * shortcuts (0278); `onFocusedKeyChange` says which row has focus. The expand mark is React Aria's chevron button,
 * so pressing it expands the row and never follows its link. Guides and marks
 * are `aria-hidden`; the level, the expanded state and the position in the set
 * are the treegrid's to announce.
 */
import type { Buffer } from '@rockaway/grid';
import {
  type CSSProperties,
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import {
  Tree as AriaTree,
  TreeItem as AriaTreeItem,
  type TreeItemProps as AriaTreeItemProps,
  type TreeProps as AriaTreeProps,
  Button,
  type Key,
  TreeItemContent,
  type TreeItemContentRenderProps,
} from 'react-aria-components';
import { useCut } from '../cut.ts';
import { cx } from '../cx.ts';
import { useGlyphs } from '../glyphs.tsx';
import { rowRuns, type StrokeStyle } from '../paint/cells.ts';
import { type TreeLineage, treeExpandMark, treeGuides, treeMarks } from './tree.pure.ts';

/** Which stroke the guides are drawn with, set on the tree and read by its rows. */
const Strokes = createContext<StrokeStyle>('glyph');

export interface TreeProps<T extends object> extends Omit<AriaTreeProps<T>, 'className' | 'style'> {
  /** How the guides are stroked: weighted like type, or hairlines. Match the screen it sits in. */
  readonly painter?: StrokeStyle;
  /**
   * No type-ahead: a printable key moves nothing, and reaches the page, for
   * a tree beside single-letter shortcuts (`j`, `k`, `/`). The arrows, Home
   * and End still move. React Aria's own option, which its GridList offers
   * and its Tree honours.
   */
  readonly disallowTypeAhead?: boolean;
  /**
   * Called with the row that has focus whenever it changes, and with `null`
   * when focus leaves the tree: what a keymap beside the tree acts on, or
   * what a status bar shows.
   */
  readonly onFocusedKeyChange?: (key: Key | null) => void;
  readonly className?: string;
  readonly style?: CSSProperties;
}

/**
 * Where the rows report their focus, and the row last reported. A row knows
 * it has focus from React Aria's render props; the tree does not, so the
 * rows tell it.
 */
interface Focus {
  readonly report: (key: Key, focused: boolean) => void;
}
const FocusReport = createContext<Focus | null>(null);

export function Tree<T extends object>({
  painter = 'glyph',
  disallowTypeAhead,
  onFocusedKeyChange,
  className,
  style,
  ...tree
}: TreeProps<T>): ReactNode {
  // The latest callback, so a new one each render does not re-report.
  const callback = useRef(onFocusedKeyChange);
  callback.current = onFocusedKeyChange;
  const focus = useMemo<Focus>(() => {
    let current: Key | null = null;
    return {
      report: (key, focused) => {
        if (focused) {
          if (current === key) return;
          current = key;
          callback.current?.(key);
          return;
        }
        // A row losing focus may only be the moment before the next row gains
        // it: wait for that, and report null only if nothing did.
        if (current !== key) return;
        queueMicrotask(() => {
          if (current !== key) return;
          current = null;
          callback.current?.(null);
        });
      },
    };
  }, []);
  return (
    <Strokes.Provider value={painter}>
      <FocusReport.Provider value={onFocusedKeyChange === undefined ? null : focus}>
        <AriaTree
          {...tree}
          // React Aria's Tree honours this through the grid list it is built
          // on, as its GridList does, but its props do not declare it.
          {...((disallowTypeAhead === undefined ? {} : { disallowTypeAhead }) as object)}
          className={cx('rk-tree', className)}
          {...(style === undefined ? {} : { style })}
        />
      </FocusReport.Provider>
    </Strokes.Provider>
  );
}

/** Tells the tree when this row gains or loses focus, from React Aria's render props. */
function ReportFocus({ id, isFocused }: { id: Key; isFocused: boolean }): null {
  const focus = useContext(FocusReport);
  const was = useRef(false);
  useEffect(() => {
    if (focus === null || was.current === isFocused) return;
    was.current = isFocused;
    focus.report(id, isFocused);
  }, [focus, id, isFocused]);
  return null;
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

/**
 * A row's label: its whole title, cut to the row in the theme's ellipsis when
 * it does not fit (0231), as `treeBuffer` cuts it.
 */
function Label({ title, ellipsis }: { title: string; ellipsis: string }): ReactNode {
  const label = useRef<HTMLSpanElement>(null);
  useCut(label, title);
  return (
    <span ref={label} className="rk-tree-label" data-rk-ellipsis={ellipsis}>
      <span className="rk-tree-text">{title}</span>
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
              <ReportFocus id={render.id} isFocused={render.isFocused} />
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
              <Label title={title} ellipsis={glyphs.mark.ellipsis} />
            </>
          );
        }}
      </TreeItemContent>
      {children}
    </AriaTreeItem>
  );
}

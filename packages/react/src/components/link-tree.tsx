/**
 * `LinkTree` (cairn 0104): a tree of links, for a site's map and a page's
 * outline. Tree's rows and guides, as a list of ordinary links.
 *
 * Tree is a widget: React Aria's treegrid, which moves a cursor with the
 * arrows and expands rows, and which a page has to hydrate before any of that
 * is true. A site's navigation is not a widget. It is a nested list of links,
 * which a browser, a screen reader and a keyboard already know what to do
 * with, before any script and without one. So this renders exactly that, on
 * a server or anywhere, with no client boundary and no hooks:
 *
 *   - a `ul` of `li`, one level a list, each row's label a real `a`
 *   - depth drawn as Tree draws it, guides two cells a level, edges the
 *     junction table joins, painted as runs the cell renderer strokes
 *   - the page you are on (`current`) is the row in reverse video, and its
 *     link is `aria-current`
 *   - Tab moves between links; the row whose link has keyboard focus shows
 *     the theme's cursor mark, drawn by the stylesheet, not by script
 *
 * Every row is open: a list of links has nothing to expand, and a reader with
 * no script would never get a closed row open again.
 */
import { type Glyphs, themeGlyphs } from '@rockaway/tokens';
import type { CSSProperties, ReactNode } from 'react';
import { cx } from '../cx.ts';
import { rowRuns, type StrokeStyle } from '../paint/cells.ts';
import { type LinkTreeItem, linkTreeRows } from './link-tree.pure.ts';
import { treeGuides } from './tree.pure.ts';

export type { LinkTreeItem } from './link-tree.pure.ts';

export interface LinkTreeProps {
  /** The rows, and the rows under them. */
  readonly items: readonly LinkTreeItem[];
  /** The `href` of the row you are on: drawn in reverse video, and `aria-current`. */
  readonly current?: string;
  /**
   * What `current` is, for a reader: `page` for a site's map (the default),
   * `location` for a page's outline, where it is the section you are in.
   */
  readonly currentKind?: 'page' | 'location';
  /** How the guides are stroked: weighted like type, or hairlines. Match the screen it sits in. */
  readonly painter?: StrokeStyle;
  /** The theme's glyphs, for the guides: a server has no provider to ask. */
  readonly glyphs?: Glyphs;
  readonly className?: string;
  readonly 'aria-label'?: string;
}

/** A row's guides, as runs of cells: the painter's own, so they stroke as painted chrome does. */
function Guides({
  level,
  last,
  leaf,
  glyphs,
  painter,
}: {
  readonly level: number;
  readonly last: readonly boolean[];
  readonly leaf: boolean;
  readonly glyphs: Glyphs;
  readonly painter: StrokeStyle;
}): ReactNode {
  const buffer = treeGuides({ level, last }, leaf, glyphs);
  if (buffer.width === 0) return null;
  let col = 0;
  return (
    <span aria-hidden="true" className="rk-link-tree-guides" data-rk-painted={painter}>
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

/** A tree of links: a site's map, or a page's outline. Renders on a server, with no script. */
export function LinkTree({
  items,
  current,
  currentKind = 'page',
  painter = 'glyph',
  glyphs = themeGlyphs.default,
  className,
  'aria-label': label,
}: LinkTreeProps): ReactNode {
  const rows = linkTreeRows(items, current);
  const branch = (items: readonly LinkTreeItem[], path: readonly number[]): ReactNode =>
    items.map((item, i) => {
      const at = [...path, i];
      const row = rows.get(at.join('.'));
      if (row === undefined) return null;
      const leaf = !row.branch;
      return (
        <li key={item.href} className="rk-link-tree-item">
          <span className="rk-link-tree-row">
            <span aria-hidden="true" className="rk-link-tree-mark rk-link-tree-cursor" />
            <Guides
              level={row.level}
              last={row.last}
              leaf={leaf}
              glyphs={glyphs}
              painter={painter}
            />
            {row.branch || row.level <= 1 ? (
              // Every row is open, so a row with rows under it is always `▾`.
              <span aria-hidden="true" className="rk-link-tree-mark rk-link-tree-expand">
                {row.branch ? glyphs.mark.expanded : ''}
              </span>
            ) : null}
            <span aria-hidden="true" className="rk-link-tree-mark" />
            <a
              className="rk-link-tree-link"
              href={item.href}
              {...(row.selected ? { 'aria-current': currentKind } : {})}
            >
              {item.title}
            </a>
          </span>
          {item.children && item.children.length > 0 ? (
            <ul className="rk-link-tree-group">{branch(item.children, at)}</ul>
          ) : null}
        </li>
      );
    });
  return (
    <ul
      className={cx('rk-link-tree', className)}
      {...(label === undefined ? {} : { 'aria-label': label })}
    >
      {branch(items, [])}
    </ul>
  );
}

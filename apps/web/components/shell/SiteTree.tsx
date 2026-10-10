/**
 * The map and the outline (cairn 0104, 0287): LinkTree's rows, as LinkTree
 * draws them (its classes, its cells, its stylesheet), rendered on the server
 * with no client boundary and no script.
 *
 * It is the site's own because the shell needs three things LinkTree does not
 * do yet: its guides and marks drawn once per glyph set, so the reader's
 * theme is right before any script (`glyph-sets.ts`); a section that closes,
 * remembered, its mark in a cell of its own; and how many pages a section
 * holds. The row you are on is `aria-current`, set by the shell's script
 * before the first paint and on every route change since, so the map is the
 * same document on every page and never re-renders.
 */
import { rowRuns } from '@rockaway/react/paint';
import { treeGuides } from '@rockaway/react/tree';
import type { CSSProperties, ReactNode } from 'react';
import { GLYPH_SETS } from '../../lib/glyph-sets.ts';
import { BASE } from '../../lib/paths.ts';

export interface TreeNode {
  readonly id?: string;
  readonly title: string;
  /** A route (`/components/`), or a place in the page (`#props`). A section may have none. */
  readonly href?: string;
  readonly children?: readonly TreeNode[];
}

export interface SiteTreeProps {
  readonly items: readonly TreeNode[];
  /** Sections close, and say how many pages they hold: the map. */
  readonly sections?: boolean;
  readonly className?: string;
}

/** A row's guides, once per glyph set: the painter's runs, as LinkTree draws them. */
function Guides({
  level,
  last,
  leaf,
}: {
  readonly level: number;
  readonly last: readonly boolean[];
  readonly leaf: boolean;
}): ReactNode {
  return GLYPH_SETS.map(({ name, glyphs }) => {
    const buffer = treeGuides({ level, last }, leaf, glyphs);
    if (buffer.width === 0) return null;
    let col = 0;
    return (
      <span
        key={name}
        aria-hidden="true"
        className="rk-link-tree-guides"
        data-rk-painted="glyph"
        data-site-glyphs={name}
      >
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
  });
}

/** The expand cell's two marks, open and shut, in every glyph set; the stylesheet picks. */
function Marks(): ReactNode {
  return GLYPH_SETS.map(({ name, glyphs }) => (
    <span key={name} data-site-glyphs={name}>
      <span className="site-tree-open">{glyphs.mark.expanded}</span>
      <span className="site-tree-shut">{glyphs.mark.collapsed}</span>
    </span>
  ));
}

const count = (node: TreeNode): number =>
  (node.children ?? []).reduce((n, child) => n + (child.href ? 1 : 0) + count(child), 0);

/** A route as a plain anchor writes it: with the base path, which `next/link` would add itself. */
const anchor = (href: string): string => (href.startsWith('#') ? href : `${BASE}${href}`);

export function SiteTree({ items, sections = false, className }: SiteTreeProps): ReactNode {
  const branch = (nodes: readonly TreeNode[], level: number, last: readonly boolean[]) =>
    nodes.map((node, i) => {
      const isLast = i === nodes.length - 1;
      const lineage = level === 1 ? [] : [...last, isLast];
      const children = node.children ?? [];
      const isBranch = children.length > 0;
      const closes = sections && isBranch && level === 1 && node.id !== undefined;
      const group = closes ? `site-map-${node.id}` : undefined;
      const pages = closes ? count(node) : 0;
      return (
        <li
          key={node.id ?? node.href ?? node.title}
          className="rk-link-tree-item"
          {...(closes ? { 'data-site-section': node.id } : {})}
        >
          <span className="rk-link-tree-row">
            <span aria-hidden="true" className="rk-link-tree-mark rk-link-tree-cursor" />
            <Guides level={level} last={lineage} leaf={!isBranch} />
            {closes ? (
              <button
                type="button"
                className="rk-link-tree-mark rk-link-tree-expand site-tree-toggle"
                aria-expanded="true"
                aria-controls={group}
                aria-label={`${node.title}: ${pages} pages`}
                // The map's keys open and close it (←, →); a tab stop on every
                // section would double the map's length for a keyboard.
                tabIndex={-1}
                data-site-toggle={node.id}
              >
                <Marks />
              </button>
            ) : isBranch || level <= 1 ? (
              <span aria-hidden="true" className="rk-link-tree-mark rk-link-tree-expand" />
            ) : null}
            <span aria-hidden="true" className="rk-link-tree-mark" />
            {node.href === undefined ? (
              <span className="rk-link-tree-link site-tree-label">{node.title}</span>
            ) : (
              <a className="rk-link-tree-link" href={anchor(node.href)}>
                {node.title}
              </a>
            )}
            {closes ? (
              <span className="site-tree-count" aria-hidden="true">
                {pages}
              </span>
            ) : null}
          </span>
          {isBranch ? (
            <ul className="rk-link-tree-group" {...(group ? { id: group } : {})}>
              {branch(children, level + 1, lineage)}
            </ul>
          ) : null}
        </li>
      );
    });
  return (
    <ul className={className ? `rk-link-tree ${className}` : 'rk-link-tree'}>
      {branch(items, 1, [])}
    </ul>
  );
}

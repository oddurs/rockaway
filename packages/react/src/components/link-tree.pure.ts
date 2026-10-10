/**
 * `LinkTree`: the pure half (cairn 0126).
 *
 * The tree as rows in Tree's own terms, so a link tree draws its guides with
 * Tree's `treeGuides` and its snapshot with Tree's `treeBuffer`: the same
 * cells, whichever tree a reader is looking at.
 */
import type { Buffer } from '@rockaway/grid';
import type { Glyphs } from '@rockaway/tokens';
import { themeGlyphs } from '@rockaway/tokens';
import { type TreeRow, treeBuffer } from './tree.pure.ts';

export interface LinkTreeItem {
  readonly title: string;
  readonly href: string;
  /** The rows under this one. */
  readonly children?: readonly LinkTreeItem[];
}

/**
 * Every row of the tree, open, in order, by its path (`0.2`): its level, which
 * of it and its ancestors are last, whether it has rows under it, and whether
 * it is the current one.
 */
export function linkTreeRows(
  items: readonly LinkTreeItem[],
  current?: string,
): Map<string, TreeRow> {
  const rows = new Map<string, TreeRow>();
  const walk = (
    level: readonly LinkTreeItem[],
    path: readonly number[],
    last: readonly boolean[],
  ): void => {
    level.forEach((item, i) => {
      const at = [...path, i];
      const isLast = i === level.length - 1;
      // Tree's lineage: from the second level down, whether each is the last.
      const lineage = path.length === 0 ? [] : [...last, isLast];
      const branch = (item.children?.length ?? 0) > 0;
      rows.set(at.join('.'), {
        label: item.title,
        level: at.length,
        last: lineage,
        ...(branch ? { branch: true, expanded: true } : {}),
        ...(current !== undefined && item.href === current ? { selected: true } : {}),
      });
      if (branch) walk(item.children ?? [], at, lineage);
    });
  };
  walk(items, [], []);
  return rows;
}

/** The tree as cells, for a snapshot: Tree's buffer, every row open. */
export function linkTreeBuffer(
  items: readonly LinkTreeItem[],
  width: number,
  current?: string,
  glyphs: Glyphs = themeGlyphs.default,
): Buffer {
  return treeBuffer({ rows: [...linkTreeRows(items, current).values()], width }, glyphs);
}

/**
 * `Breadcrumbs`: the pure half (cairn 0319).
 *
 * Where a page sits in a path, as text on one row: each level, the theme's
 * separator between them with a cell of air either side, and the current page
 * last. A path longer than `maxItems` keeps its first level and its last ones,
 * and folds the middle into the theme's ellipsis, which opens a menu of the
 * levels it hides. No React and no client boundary; `breadcrumbs.tsx` has the
 * component.
 */
import { Attr, Buffer, drawText, stringWidth } from '@rockaway/grid';
import { type Glyphs, themeGlyphs } from '@rockaway/tokens';

export interface BreadcrumbItem {
  /** The key React Aria knows the level by. The label when not given. */
  readonly id?: string;
  readonly label: string;
  /** Where the level is. The current page, last, needs none. */
  readonly href?: string;
}

/** A path as shown: the levels, and where the folded middle is, if anywhere. */
export type Shown<T> =
  | { readonly kind: 'level'; readonly item: T }
  | { readonly kind: 'more'; readonly hidden: readonly T[] };

/**
 * Fold a path to at most `maxItems` entries: the first level, the ellipsis
 * for the middle, and the last `maxItems - 2`. Under three it is not folded:
 * a path of the first, the ellipsis and nothing else says nothing.
 */
export function foldPath<T>(items: readonly T[], maxItems?: number): Shown<T>[] {
  const levels = items.map((item): Shown<T> => ({ kind: 'level', item }));
  if (maxItems === undefined || maxItems < 3 || items.length <= maxItems) return levels;
  const tail = maxItems - 2;
  const [first] = items;
  if (first === undefined) return levels;
  return [
    { kind: 'level', item: first },
    { kind: 'more', hidden: items.slice(1, items.length - tail) },
    ...items.slice(items.length - tail).map((item): Shown<T> => ({ kind: 'level', item })),
  ];
}

export interface BreadcrumbsTextOptions {
  /** As `Breadcrumbs`' `maxItems`. */
  readonly maxItems?: number;
}

/**
 * A path as cells, on one row: the text model of `Breadcrumbs` and its
 * snapshot. The separator is muted, the current page bold.
 */
export function breadcrumbsBuffer(
  items: readonly string[],
  options: BreadcrumbsTextOptions = {},
  glyphs: Glyphs = themeGlyphs.default,
): Buffer {
  const shown = foldPath(items, options.maxItems);
  const separator = ` ${glyphs.mark.separator} `;
  const words = shown.map((entry) => (entry.kind === 'more' ? glyphs.mark.ellipsis : entry.item));
  const width = Math.max(
    1,
    words.reduce((sum, w) => sum + stringWidth(w), 0) +
      stringWidth(separator) * Math.max(0, words.length - 1),
  );
  return Buffer.create({ width, height: 1 }).draw((draft) => {
    let x = 0;
    words.forEach((word, i) => {
      if (i > 0) {
        x += drawText(draft, { x, y: 0 }, separator, {
          style: { fg: 'fg.muted', attrs: Attr.none },
        });
      }
      const last = i === words.length - 1;
      x += drawText(draft, { x, y: 0 }, word, {
        style: last
          ? { fg: 'fg.default', attrs: Attr.bold }
          : { fg: 'fg.accent', attrs: Attr.none },
      });
    });
  });
}

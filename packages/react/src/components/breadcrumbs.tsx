'use client';

/**
 * `Breadcrumbs` (cairn 0319): where a page sits, as a path on one row.
 *
 * Text on the grid, every character a cell: each level a Link, through the
 * app's own link component (0300), the theme's separator between them with a
 * cell of air either side, and the current page last, bold, in the body
 * colour, and not a link. A path longer than `maxItems` keeps its first level
 * and its last ones, and folds the middle into the theme's ellipsis: a button
 * one cell wide that opens a Menu of the levels it hides.
 *
 * Behaviour is React Aria's `Breadcrumbs`: a list in a `nav`, the current
 * page `aria-current="page"`. The separators are `aria-hidden`; the list says
 * where each level is.
 */
import { type CSSProperties, type ReactNode, useMemo } from 'react';
import {
  Breadcrumb as AriaBreadcrumb,
  Breadcrumbs as AriaBreadcrumbs,
  Button as AriaButton,
} from 'react-aria-components';
import { cx } from '../cx.ts';
import { useGlyphs } from '../glyphs.tsx';
import { type BreadcrumbItem, foldPath } from './breadcrumbs.pure.ts';
import { Link } from './link.tsx';
import { Menu, MenuItem, MenuTrigger } from './menu.tsx';

export interface BreadcrumbsProps {
  /** The path, from the top: each level a label and where it is. The last is the current page. */
  readonly items: readonly BreadcrumbItem[];
  /** What the `nav` is called. "Breadcrumbs" by default. */
  readonly label?: string;
  /** Fold the middle of a longer path into a menu, keeping the first level and the last ones. */
  readonly maxItems?: number;
  /** What the folded middle's button says to a screen reader. "More levels" by default. */
  readonly moreLabel?: string;
  readonly className?: string;
  readonly style?: CSSProperties;
}

const keyOf = (item: BreadcrumbItem): string => item.id ?? item.label;

export function Breadcrumbs({
  items,
  label = 'Breadcrumbs',
  maxItems,
  moreLabel = 'More levels',
  className,
  style,
}: BreadcrumbsProps): ReactNode {
  const { mark } = useGlyphs();
  const shown = useMemo(() => foldPath(items, maxItems), [items, maxItems]);
  const last = items.at(-1);
  return (
    <nav
      aria-label={label}
      className={cx('rk-breadcrumbs', className)}
      {...(style === undefined ? {} : { style })}
    >
      <AriaBreadcrumbs className="rk-breadcrumbs-list">
        {shown.map((entry, i) => {
          const separator =
            i === 0 ? null : (
              <span aria-hidden="true" className="rk-breadcrumb-separator">
                {mark.separator}
              </span>
            );
          if (entry.kind === 'more') {
            return (
              <AriaBreadcrumb key="rk-more" id="rk-more" className="rk-breadcrumb">
                {separator}
                <MenuTrigger>
                  <AriaButton
                    className="rk-breadcrumb-more"
                    aria-label={moreLabel}
                    // A control, to the conformance levels (0182).
                    data-rk-control=""
                  >
                    {mark.ellipsis}
                  </AriaButton>
                  <Menu aria-label={moreLabel}>
                    {entry.hidden.map((item) => (
                      <MenuItem
                        key={keyOf(item)}
                        id={keyOf(item)}
                        {...(item.href === undefined ? {} : { href: item.href })}
                      >
                        {item.label}
                      </MenuItem>
                    ))}
                  </Menu>
                </MenuTrigger>
              </AriaBreadcrumb>
            );
          }
          const { item } = entry;
          const current = item === last;
          return (
            <AriaBreadcrumb key={keyOf(item)} id={keyOf(item)} className="rk-breadcrumb">
              {separator}
              {current || item.href === undefined ? (
                <span
                  className="rk-breadcrumb-current"
                  {...(current ? { 'aria-current': 'page' as const } : {})}
                >
                  {item.label}
                </span>
              ) : (
                <Link href={item.href}>{item.label}</Link>
              )}
            </AriaBreadcrumb>
          );
        })}
      </AriaBreadcrumbs>
    </nav>
  );
}

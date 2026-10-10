/**
 * Menu rendered once, as small as it can be: the metadata test's evidence for
 * its roles, its focusability and the variant attributes it writes
 * (test/metadata.test.ts). Closed, as Popover's is: a menu opens in one, and
 * has no trigger here.
 */
import { createElement, type ReactElement } from 'react';
import { Menu, MenuItem } from './menu.tsx';

export function fixture(props?: Record<string, unknown>): ReactElement {
  return createElement(
    Menu,
    { 'aria-label': 'Actions', ...props },
    createElement(MenuItem, { id: 'a' }, 'Rename'),
  );
}

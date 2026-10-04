/**
 * List rendered once, as small as it can be: the metadata test's evidence
 * for its roles, its focusability and the variant attributes it writes
 * (test/metadata.test.ts).
 */
import { createElement, type ReactElement } from 'react';
import { List, ListItem } from './list.tsx';

export function fixture(props?: Record<string, unknown>): ReactElement {
  return createElement(
    List,
    { 'aria-label': 'files', selectionMode: 'single', ...props },
    createElement(ListItem, { id: 'a' }, 'a.ts'),
    createElement(ListItem, { id: 'b' }, 'b.ts'),
  );
}

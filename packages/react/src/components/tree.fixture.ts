/**
 * Tree rendered once, as small as it can be: the metadata test's evidence
 * for its roles, its focusability and the variant attributes it writes
 * (test/metadata.test.ts).
 */
import { createElement, type ReactElement } from 'react';
import { Tree, TreeItem } from './tree.tsx';

export function fixture(props?: Record<string, unknown>): ReactElement {
  return createElement(
    Tree,
    { 'aria-label': 'files', defaultExpandedKeys: ['src'], ...props },
    createElement(
      TreeItem,
      { id: 'src', title: 'src' },
      createElement(TreeItem, { id: 'a', title: 'a.ts' }),
    ),
  );
}

/**
 * LinkTree rendered once, as small as it can be: the metadata test's evidence
 * for its roles, its focusability and the variant attributes it writes
 * (test/metadata.test.ts).
 */
import { createElement, type ReactElement } from 'react';
import { LinkTree } from './link-tree.tsx';

export function fixture(props?: Record<string, unknown>): ReactElement {
  return createElement(LinkTree, {
    'aria-label': 'Site',
    items: [{ title: 'Home', href: '/', children: [{ title: 'Grid', href: '/grid/' }] }],
    current: '/grid/',
    ...props,
  });
}

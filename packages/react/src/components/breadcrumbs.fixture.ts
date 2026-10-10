/**
 * Breadcrumbs rendered once, as small as it can be: the metadata test's
 * evidence for its roles and the attributes it writes (test/metadata.test.ts).
 */
import { createElement, type ReactElement } from 'react';
import { Breadcrumbs } from './breadcrumbs.tsx';

export function fixture(props?: Record<string, unknown>): ReactElement {
  return createElement(Breadcrumbs, {
    items: [{ label: 'docs', href: '/docs' }, { label: 'Grid' }],
    ...props,
  });
}

/**
 * SkipLink rendered once, as small as it can be: the metadata test's evidence
 * for its roles, its focusability and the variant attributes it writes
 * (test/metadata.test.ts).
 */
import { createElement, type ReactElement } from 'react';
import { SkipLink } from './skip-link.tsx';

export function fixture(props?: Record<string, unknown>): ReactElement {
  return createElement(SkipLink, { target: 'main', ...props });
}

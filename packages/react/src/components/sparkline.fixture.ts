/**
 * Sparkline rendered once, as small as it can be: the metadata test's evidence
 * for its roles, its focusability and the variant attributes it writes
 * (test/metadata.test.ts).
 */
import { createElement, type ReactElement } from 'react';
import { Sparkline } from './sparkline.tsx';

export function fixture(props?: Record<string, unknown>): ReactElement {
  return createElement(Sparkline, { label: 'Load', values: [1, 3, 2, 4], ...props });
}

/**
 * ProgressBar rendered once, as small as it can be: the metadata test's evidence
 * for its roles, its focusability and the variant attributes it writes
 * (test/metadata.test.ts).
 */
import { createElement, type ReactElement } from 'react';
import { ProgressBar } from './progress.tsx';

export function fixture(props?: Record<string, unknown>): ReactElement {
  return createElement(ProgressBar, { label: 'Installing', value: 62, ...props });
}

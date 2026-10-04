/**
 * Frame rendered once, as small as it can be: the metadata test's evidence
 * for its roles, its focusability and the variant attributes it writes
 * (test/metadata.test.ts).
 */
import { createElement, type ReactElement } from 'react';
import { Frame } from './frame.tsx';

export function fixture(props?: Record<string, unknown>): ReactElement {
  return createElement(Frame, { title: 'tokens', cols: 20, rows: 5, ...props });
}

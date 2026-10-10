/**
 * Panes rendered once, as small as it can be: the metadata test's evidence
 * for its roles, its focusability and the variant attributes it writes
 * (test/metadata.test.ts).
 */
import { createElement, type ReactElement } from 'react';
import { Pane, Panes } from './panes.tsx';

export function fixture(props?: Record<string, unknown>): ReactElement {
  return createElement(
    Panes,
    { cols: 30, rows: 5, ...props },
    createElement(Pane, { title: 'files', size: 12 }, 'a.ts'),
    createElement(Pane, { title: 'diff' }, '+1 -1'),
  );
}

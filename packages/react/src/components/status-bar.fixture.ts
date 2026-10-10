/**
 * StatusBar rendered once, as small as it can be: the metadata test's
 * evidence for its roles, its focusability and the variant attributes it
 * writes (test/metadata.test.ts).
 */
import { createElement, type ReactElement } from 'react';
import { StatusBar, StatusMessage, StatusSegment } from './status-bar.tsx';

export function fixture(props?: Record<string, unknown>): ReactElement {
  return createElement(
    StatusBar,
    { cols: 30 },
    createElement(StatusSegment, { variant: 'mode', ...props }, 'NORMAL'),
    createElement(StatusMessage, null, 'Copied'),
  );
}

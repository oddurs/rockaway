/**
 * Toolbar rendered once, as small as it can be: the metadata test's evidence
 * for its roles and the attributes it writes (test/metadata.test.ts).
 */
import { createElement, type ReactElement } from 'react';
import { Toolbar, ToolbarButton, ToolbarGroup } from './toolbar.tsx';

export function fixture(props?: Record<string, unknown>): ReactElement {
  return createElement(
    Toolbar,
    { label: 'Format', ...props },
    createElement(ToolbarGroup, { label: 'Text' }, createElement(ToolbarButton, null, 'Bold')),
  );
}

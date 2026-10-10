/**
 * Tabs rendered once, as small as it can be: the metadata test's evidence
 * for its roles, its focusability and the variant attributes it writes
 * (test/metadata.test.ts).
 */
import { createElement, type ReactElement } from 'react';
import { Tab, TabList, TabPanel, Tabs } from './tabs.tsx';

export function fixture(props?: Record<string, unknown>): ReactElement {
  return createElement(
    Tabs,
    { cols: 30, rows: 4, ...props },
    createElement(
      TabList,
      { 'aria-label': 'View' },
      createElement(Tab, { id: 'files' }, 'files'),
      createElement(Tab, { id: 'log' }, 'log'),
    ),
    createElement(TabPanel, { id: 'files' }, 'a.ts'),
    createElement(TabPanel, { id: 'log' }, 'ce9af26'),
  );
}

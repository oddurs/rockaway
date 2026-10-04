/**
 * Table rendered once, as small as it can be: the metadata test's evidence
 * for its roles, its focusability and the variant attributes it writes
 * (test/metadata.test.ts).
 */
import { createElement, type ReactElement } from 'react';
import { Cell, Column, Row, Table, TableBody, TableHeader } from './table.tsx';

export function fixture(props?: Record<string, unknown>): ReactElement {
  return createElement(
    Table,
    { 'aria-label': 'files', ...props },
    createElement(
      TableHeader,
      null,
      // A column's words are required, and createElement's types cannot see them in its third argument.
      // biome-ignore lint/correctness/noChildrenProp: as above
      createElement(Column, { id: 'name', isRowHeader: true, children: 'Name' }),
    ),
    createElement(
      TableBody,
      null,
      createElement(Row, { id: 'a' }, createElement(Cell, null, 'a.ts')),
    ),
  );
}

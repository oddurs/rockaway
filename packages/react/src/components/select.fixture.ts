/**
 * Select rendered once, as small as it can be: the metadata test's evidence
 * for its roles, its focusability and the variant attributes it writes
 * (test/metadata.test.ts).
 */
import { createElement, type ReactElement } from 'react';
import { Select, SelectItem } from './select.tsx';

export function fixture(props?: Record<string, unknown>): ReactElement {
  return createElement(
    Select,
    { label: 'Theme', ...props },
    // An option's words are required, and createElement's types cannot see them in its third argument.
    // biome-ignore lint/correctness/noChildrenProp: as above
    createElement(SelectItem, { id: 'ink', children: 'ink' }),
  );
}

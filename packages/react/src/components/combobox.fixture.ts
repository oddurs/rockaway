/**
 * ComboBox rendered once, as small as it can be: the metadata test's evidence
 * for its roles, its focusability and the variant attributes it writes
 * (test/metadata.test.ts).
 */
import { createElement, type ReactElement } from 'react';
import { ComboBox, ComboBoxItem } from './combobox.tsx';

export function fixture(props?: Record<string, unknown>): ReactElement {
  return createElement(
    ComboBox,
    { label: 'Author', ...props },
    // An option's words are required, and createElement's types cannot see them in its third argument.
    // biome-ignore lint/correctness/noChildrenProp: as above
    createElement(ComboBoxItem, { id: 'ada', children: 'Ada Lovelace' }),
  );
}

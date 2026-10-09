/**
 * Checkbox rendered once, as small as it can be: the metadata test's evidence
 * for its roles, its focusability and the variant attributes it writes
 * (test/metadata.test.ts).
 */
import { createElement, Fragment, type ReactElement } from 'react';
import { Checkbox, CheckboxGroup } from './checkbox.tsx';

export function fixture(props?: Record<string, unknown>): ReactElement {
  return createElement(
    Fragment,
    null,
    createElement(Checkbox, props, 'Sign commits'),
    createElement(
      CheckboxGroup,
      { label: 'Branches' },
      createElement(Checkbox, { value: 'main' }, 'main'),
    ),
  );
}

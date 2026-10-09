/**
 * Fieldset rendered once, as small as it can be: the metadata test's evidence
 * for its roles, its focusability and the variant attributes it writes
 * (test/metadata.test.ts). Both parts of the module: the variant is
 * FieldFrame's, and Fieldset is always a group.
 */
import { createElement, Fragment, type ReactElement } from 'react';
import { FieldFrame, Fieldset } from './fieldset.tsx';

export function fixture(props?: Record<string, unknown>): ReactElement {
  return createElement(
    Fragment,
    null,
    createElement(Fieldset, { legend: 'Notify' }),
    createElement(FieldFrame, { label: 'Message', ...props }),
  );
}

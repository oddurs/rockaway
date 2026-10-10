/**
 * RadioGroup rendered once, as small as it can be: the metadata test's
 * evidence for its roles, its focusability and the variant attributes it
 * writes (test/metadata.test.ts).
 */
import { createElement, type ReactElement } from 'react';
import { Radio, RadioGroup } from './radio-group.tsx';

export function fixture(props?: Record<string, unknown>): ReactElement {
  return createElement(
    RadioGroup,
    { label: 'Branch', ...props },
    createElement(Radio, { value: 'main' }, 'main'),
  );
}

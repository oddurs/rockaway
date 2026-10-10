/**
 * Card rendered once, as small as it can be: the metadata test's evidence for
 * its roles, its focusability and the attributes it writes
 * (test/metadata.test.ts).
 */
import { createElement, type ReactElement } from 'react';
import { Card } from './card.tsx';

export function fixture(props?: Record<string, unknown>): ReactElement {
  return createElement(
    Card,
    { title: 'Deploys', ...props },
    createElement('p', null, 'Twelve today.'),
  );
}

/**
 * Text rendered once, as small as it can be: the metadata test's evidence
 * for its roles, its focusability and the attributes it writes
 * (test/metadata.test.ts).
 */
import { createElement, type ReactElement } from 'react';
import { Text } from './text.tsx';

export function fixture(props?: Record<string, unknown>): ReactElement {
  return createElement(Text, { size: 2, ...props }, 'Rockaway');
}

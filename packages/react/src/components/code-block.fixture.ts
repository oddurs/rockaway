/**
 * CodeBlock rendered once, as small as it can be: the metadata test's
 * evidence for its roles, its focusability and the variant attributes it
 * writes (test/metadata.test.ts).
 */
import { createElement, type ReactElement } from 'react';
import { CodeBlock } from './code-block.tsx';

export function fixture(props?: Record<string, unknown>): ReactElement {
  return createElement(CodeBlock, { code: 'let a = 1;', title: 'a.ts', cols: 40, ...props });
}

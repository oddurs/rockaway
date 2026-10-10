/**
 * Picture rendered once, as small as it can be: the metadata test's evidence
 * for its roles and the attributes it writes (test/metadata.test.ts).
 */
import { createElement, type ReactElement } from 'react';
import { Picture } from './picture.tsx';

export function fixture(props?: Record<string, unknown>): ReactElement {
  return createElement(Picture, {
    src: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=',
    alt: 'A dot',
    ratio: 2,
    cols: 4,
    caption: 'A dot.',
    ...props,
  });
}

/**
 * Tooltip rendered once, as small as it can be: the metadata test's evidence
 * for its roles, its focusability and the variant attributes it writes
 * (test/metadata.test.ts). Closed, and so nothing: a tooltip renders on hover
 * or focus, never on a server. Its role is React Aria's, asserted in its
 * stories.
 */
import { createElement, type ReactElement } from 'react';
import { OverlayLayer } from './overlay.tsx';
import { Tooltip } from './tooltip.tsx';

export function fixture(props?: Record<string, unknown>): ReactElement {
  return createElement(
    OverlayLayer,
    null,
    createElement(Tooltip, { isOpen: false, ...props }, 'Save the file'),
  );
}

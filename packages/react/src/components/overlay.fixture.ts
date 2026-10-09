/**
 * OverlayPopover rendered once, as small as it can be: the metadata test's evidence
 * for its roles, its focusability and the variant attributes it writes
 * (test/metadata.test.ts). Closed: a popover has no trigger here, and on a
 * server an open one renders nothing anyway.
 */
import { createElement, type ReactElement } from 'react';
import { OverlayLayer, OverlayPopover } from './overlay.tsx';

export function fixture(props?: Record<string, unknown>): ReactElement {
  return createElement(
    OverlayLayer,
    null,
    createElement(OverlayPopover, { isOpen: false, ...props }, 'inside'),
  );
}

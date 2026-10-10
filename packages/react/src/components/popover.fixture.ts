/**
 * Popover rendered once, as small as it can be: the metadata test's evidence
 * for its roles, its focusability and the variant attributes it writes
 * (test/metadata.test.ts). Closed, as OverlayPopover's is: a popover has no
 * trigger here, and on a server an open one renders nothing anyway.
 */
import { createElement, type ReactElement } from 'react';
import { OverlayLayer } from './overlay.tsx';
import { Popover } from './popover.tsx';

export function fixture(props?: Record<string, unknown>): ReactElement {
  return createElement(
    OverlayLayer,
    null,
    createElement(Popover, { isOpen: false, ...props }, 'inside'),
  );
}

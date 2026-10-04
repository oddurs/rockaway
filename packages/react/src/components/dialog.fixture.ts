/**
 * Dialog rendered once, as small as it can be: the metadata test's evidence
 * for its roles, its focusability and the variant attributes it writes
 * (test/metadata.test.ts). Open: but an overlay renders nothing on a server,
 * so the dialog's body is rendered as its modal holds it, a dialog and an
 * alert, beside the component itself.
 */
import { createElement, Fragment, type ReactElement } from 'react';
import { Dialog, openDialogBody } from './dialog.tsx';
import { OverlayLayer } from './overlay.tsx';

export function fixture(props?: Record<string, unknown>): ReactElement {
  return createElement(
    Fragment,
    null,
    createElement(
      OverlayLayer,
      null,
      createElement(Dialog, { title: 'Rename', isOpen: true, ...props }, 'inside'),
    ),
    openDialogBody({ title: 'Rename', variant: 'default', ...props }),
    openDialogBody({ title: 'Discard?', variant: 'alert' }),
  );
}

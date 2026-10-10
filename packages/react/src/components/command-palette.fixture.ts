/**
 * CommandPalette rendered once, as small as it can be: the metadata test's
 * evidence for its roles, its focusability and the variant attributes it
 * writes (test/metadata.test.ts). Closed: a modal renders nothing on a server.
 * The keymap it binds through is around it.
 */
import { createElement, type ReactElement } from 'react';
import { CommandPalette } from './command-palette.tsx';
import { Keymap } from './keymap.tsx';

export function fixture(props?: Record<string, unknown>): ReactElement {
  return createElement(Keymap, null, createElement(CommandPalette, { commands: [], ...props }));
}

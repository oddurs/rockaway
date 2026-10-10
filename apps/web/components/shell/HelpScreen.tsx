'use client';

/**
 * The keys, as a screen in the page's pane (cairn 0141): the system's own
 * help, built from the shell's bindings. Its own module, loaded when `?` is
 * first pressed, since it draws with the system's components and their glyphs.
 */
import { KeymapHelp } from '@rockaway/react/keymap';
import type { ReactNode } from 'react';
import type { ShellBinding } from '../../lib/shell.ts';
import { Glyphed } from '../Glyphed.tsx';

export function HelpScreen({
  bindings,
}: {
  readonly bindings: readonly ShellBinding[];
}): ReactNode {
  return (
    <section aria-labelledby="site-keys" className="rk-prose rk-scroll site-scroll site-help">
      <h1 id="site-keys">Keys</h1>
      <Glyphed>
        <KeymapHelp bindings={bindings} platform="other" />
      </Glyphed>
    </section>
  );
}

/**
 * The landing page's top bar (cairn 0108): the brand, where to go, and the
 * look, on one row of whole cells that wraps on a phone. Rendered on the
 * server with no script: the links are links, and the look's buttons are
 * bound by the page's script (src/scripts/landing.ts), as the shell's are.
 */
import { Button } from '@rockaway/react/button';
import { KeyHint } from '@rockaway/react/key-hint';
import { Link } from '@rockaway/react/link';
import type { ReactNode } from 'react';
import { DEFAULT_LOOK } from '../lib/look.ts';

export interface TopBarProps {
  /** The site's root, under its base. */
  readonly home: string;
  /** Where the docs start. */
  readonly docs: string;
  readonly components: string;
}

export function TopBar({ home, docs, components }: TopBarProps): ReactNode {
  return (
    <header className="rk-prose site-topbar">
      <div className="site-topbar-row">
        <a className="site-brand" href={home} data-attrs="reverse">
          rockaway
        </a>
        <nav aria-label="Site" className="site-topbar-links">
          <Link href={docs}>Docs</Link> <Link href={components}>Components</Link>{' '}
          <Link href="https://github.com/oddurs/rockaway">GitHub</Link>
        </nav>
        <span role="status" className="site-topbar-message" />
        <div className="site-topbar-look">
          <Button
            delimiters="none"
            aria-label={`Theme: ${DEFAULT_LOOK.theme}`}
            data-site-look="theme"
          >
            <KeyHint keys="t" notation="terminal" decorative />{' '}
            <span data-site-look-value>{DEFAULT_LOOK.theme}</span>
          </Button>{' '}
          <Button delimiters="none" aria-label={`Mode: ${DEFAULT_LOOK.mode}`} data-site-look="mode">
            <KeyHint keys="m" notation="terminal" decorative />{' '}
            <span data-site-look-value>{DEFAULT_LOOK.mode}</span>
          </Button>
        </div>
      </div>
      <hr />
    </header>
  );
}

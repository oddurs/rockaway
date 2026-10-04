/**
 * The site's shell (cairn 0104): every page, as a TUI.
 *
 * Three panes share their borders: the site's map, the page and its outline.
 * Under them, the status bar says where you are and what the keys do. All of
 * it is `@rockaway/react`, rendered here on the server and never hydrated:
 * the page's script (`src/scripts/shell.ts`) measures the window and lays the
 * same components out again with the system's pure and DOM halves, and binds
 * the keys with its keymap engine. No React reaches the page for the shell.
 *
 *   - It is a website first. The map and the outline are link trees, lists
 *     of ordinary links, and every `g` jump is a row of the map. With no
 *     script the panes become a plain document (`site.css`).
 *   - The URL is the state. The map's current row is the page's path, and the
 *     section you have scrolled to is the fragment, so any place is a link.
 *   - The page is the slot: Markdown set by `.rk-prose`, scrolled inside the
 *     content pane with no native scrollbar.
 *
 * Its shape (panes, segments, keys) is `src/lib/shell.ts`, which the script
 * reads too, so the two cannot disagree.
 */
import { KeyHint } from '@rockaway/react/key-hint';
import { KeymapHelp } from '@rockaway/react/keymap';
import { LinkTree } from '@rockaway/react/link-tree';
import { Pane, Panes } from '@rockaway/react/panes';
import { StatusBar, StatusMessage, StatusSegment } from '@rockaway/react/status-bar';
import type { ReactNode } from 'react';
import type { NavNode } from '../lib/nav.ts';
import type { Heading } from '../lib/outline.ts';
import {
  outlineItems,
  SERVER_SIZE,
  type ShellBinding,
  STATUS_SEGMENTS,
  shellSplit,
} from '../lib/shell.ts';

export interface ShellProps {
  /** The site's map. */
  readonly nav: readonly NavNode[];
  /** This page's `href`, as the map has it. */
  readonly current: string;
  /** The rows of the map from the top down to this page, for the status bar. */
  readonly trail: readonly string[];
  /** The part of the site the page is in, for the mode segment: `FOUNDATIONS`. */
  readonly section: string;
  /** What the content pane's border says. */
  readonly title: string;
  readonly headings: readonly Heading[];
  /** The keys, as the help screen lists them. */
  readonly bindings: readonly ShellBinding[];
  /** The page: Astro's slot. */
  readonly children?: ReactNode;
}

const segment = (name: (typeof STATUS_SEGMENTS)[number]['name']) => {
  const found = STATUS_SEGMENTS.find((s) => s.name === name);
  return {
    priority: found?.priority ?? 0,
    ...(found && 'align' in found ? { align: found.align } : {}),
  };
};

export function Shell({
  nav,
  current,
  trail,
  section,
  title,
  headings,
  bindings,
  children,
}: ShellProps): ReactNode {
  const split = shellSplit({ stacked: false, title, outline: headings.length > 0 });
  const [map, page, outline] = split.panes;
  return (
    <div className="site-shell" data-site-title={title}>
      <Panes direction="row" fallback={SERVER_SIZE}>
        <Pane {...map} label="" pad={0}>
          <nav aria-label="Site" className="rk-scroll site-scroll" data-site-map>
            <LinkTree items={nav} current={current} />
          </nav>
        </Pane>
        <Pane {...page} label="" pad={0}>
          <main id="content" tabIndex={-1} className="rk-scroll site-scroll site-page">
            <div data-site-page>{children}</div>
            <section
              aria-labelledby="site-keys"
              className="rk-prose"
              data-site-help
              data-site-bindings={JSON.stringify(bindings)}
              hidden
            >
              <h1 id="site-keys">Keys</h1>
              <p>
                Each of these is a shortcut for something on the screen: a scroll of this pane, or a
                row of the map, which is a link.
              </p>
              <KeymapHelp bindings={bindings} platform="other" />
            </section>
          </main>
        </Pane>
        <Pane {...outline} label="" pad={0}>
          <aside aria-label="On this page" className="rk-scroll site-scroll" data-site-outline>
            <LinkTree items={outlineItems(headings)} currentKind="location" />
          </aside>
        </Pane>
      </Panes>
      <StatusBar label="Status">
        <StatusSegment variant="mode" {...segment('mode')}>
          {section}
        </StatusSegment>
        <StatusSegment {...segment('where')} label="You are at">
          {trail.join(' / ')}
        </StatusSegment>
        <StatusMessage />
        <StatusSegment {...segment('keys')}>
          <span data-site-when="page">
            <KeyHint keys="?" platform="other">
              keys
            </KeyHint>
          </span>
          <span data-site-when="help" hidden>
            <KeyHint keys="esc" platform="other">
              back
            </KeyHint>
          </span>
        </StatusSegment>
        <StatusSegment {...segment('position')} label="Position">
          Top
        </StatusSegment>
      </StatusBar>
    </div>
  );
}

'use client';

/**
 * The shell's script (cairn 0104, rebuilt for Next): the status bar, and what
 * makes the site one piece of software rather than pages.
 *
 * Everything else in the shell is the server's: the grid and its panes, their
 * borders, the map and the outline are markup and a stylesheet, right before
 * this arrives and unchanged by it. So this is small, and does only what
 * needs a script:
 *
 *   - every internal link is followed by the client router, whether it is a
 *     `next/link` or a plain anchor in Markdown or the map, and fetched before
 *     it is followed, when it is pointed at or focused; the page never loads
 *     again, so the shell, its scroll and its state are never rebuilt
 *   - the map marks the page you are on, and the status bar says where it is
 *   - each new page has its heading focused and its name said, as a page
 *     load would have done, and back returns to where it was scrolled
 *   - the status bar says where you are in the page
 *
 * The keys, the look, the copy, the help and the map's filter are the
 * extras: loaded when the browser is idle, or at the first key or press,
 * so none of them is in the script every page waits for.
 */
import type { Route } from 'next';
import { usePathname, useRouter } from 'next/navigation';
import {
  lazy,
  type ReactNode,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { modeOf, type NavNode, trail } from '../../lib/nav.ts';
import { BASE } from '../../lib/paths.ts';
import type { ShellBinding } from '../../lib/shell.ts';
import { toggleDrawer } from '../../lib/shell-state.ts';

const Extras = lazy(() =>
  import('./ShellExtras.tsx').then((module) => ({ default: module.ShellExtras })),
);

export interface ShellProps {
  readonly nav: readonly NavNode[];
  readonly bindings: readonly ShellBinding[];
}

/** A route as the router names it, from an anchor's path: the base path taken off. */
function routeOf(anchor: HTMLAnchorElement): string | undefined {
  if (anchor.target && anchor.target !== '_self') return undefined;
  if (anchor.hasAttribute('download')) return undefined;
  const url = new URL(anchor.href, location.href);
  if (url.origin !== location.origin) return undefined;
  if (BASE && !url.pathname.startsWith(`${BASE}/`) && url.pathname !== BASE) return undefined;
  return `${url.pathname.slice(BASE.length) || '/'}${url.search}${url.hash}`;
}

const anchorOf = (event: Event): HTMLAnchorElement | null =>
  event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;

/** The page's own scroller: each page brings its own, inside the page's pane. */
export const pageScroller = (): HTMLElement | null =>
  document.querySelector<HTMLElement>('#content [data-site-scroll="page"]');

/** Where each page was scrolled to, for back and forward. */
const scrolls = new Map<string, number>();

/** Run when the browser is idle, or soon anyway. */
const idle = (run: () => void): (() => void) => {
  if (typeof requestIdleCallback === 'function') {
    const id = requestIdleCallback(run, { timeout: 1500 });
    return () => cancelIdleCallback(id);
  }
  const id = setTimeout(run, 300);
  return () => clearTimeout(id);
};

export function Shell({ nav, bindings }: ShellProps): ReactNode {
  const router = useRouter();
  // Every page's address ends in a slash, as the export writes it.
  const route = usePathname();
  const pathname = route.endsWith('/') ? route : `${route}/`;

  const [message, setMessage] = useState({ text: '', id: 0 });
  const [position, setPosition] = useState('Top');
  const [helping, setHelping] = useState(false);
  const [extras, setExtras] = useState(false);
  const say = useCallback((text: string): void => setMessage((m) => ({ text, id: m.id + 1 })), []);

  const path = trail(nav, pathname);

  // ── Navigation: every internal link through the router ─────────────────
  useEffect(() => {
    const fetched = new Set<string>();
    const prefetch = (route: string | undefined): void => {
      const page = route?.split('#')[0];
      if (page === undefined || fetched.has(page)) return;
      fetched.add(page);
      router.prefetch(page as Route);
    };
    const click = (event: MouseEvent): void => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = anchorOf(event);
      const to = anchor ? routeOf(anchor) : undefined;
      if (!anchor || to === undefined) return;
      const here = location.pathname.slice(BASE.length) || '/';
      // A link to a place on this page is the browser's to follow.
      if (to.startsWith(`${here}#`) || to.startsWith('#')) return;
      event.preventDefault();
      router.push(to as Route, { scroll: false });
    };
    const pointed = (event: Event): void => {
      const anchor = anchorOf(event);
      prefetch(anchor ? routeOf(anchor) : undefined);
    };
    document.addEventListener('click', click);
    document.addEventListener('pointerover', pointed, { passive: true });
    document.addEventListener('pointerdown', pointed, { passive: true });
    document.addEventListener('focusin', pointed);
    // The pages a key jumps to are fetched as soon as there is nothing else to do.
    const cancel = idle(() => {
      for (const binding of bindings) {
        if (binding.action.startsWith('go:')) prefetch(binding.action.slice(3));
      }
    });
    return () => {
      cancel();
      document.removeEventListener('click', click);
      document.removeEventListener('pointerover', pointed);
      document.removeEventListener('pointerdown', pointed);
      document.removeEventListener('focusin', pointed);
    };
  }, [router, bindings]);

  // ── Each page: marked in the map, its scroll back, its heading focused ──
  const popped = useRef(false);
  const first = useRef(true);
  useEffect(() => {
    const pop = (): void => {
      popped.current = true;
    };
    window.addEventListener('popstate', pop);
    return () => window.removeEventListener('popstate', pop);
  }, []);
  useLayoutEffect(() => {
    const here = `${BASE}${pathname}`;
    for (const link of document.querySelectorAll<HTMLAnchorElement>(
      '.site-map a.rk-link-tree-link',
    )) {
      if (link.getAttribute('href') === here) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
    setHelping(false);
    toggleDrawer(false);
    const page = pageScroller();
    const outline = document.querySelector<HTMLElement>('[data-site-scroll="outline"]');
    const saved = scrolls.get(pathname);
    if (first.current) {
      if (location.hash)
        document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
    } else if (popped.current && saved !== undefined && page) {
      page.scrollTop = saved;
    } else if (location.hash) {
      document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
    } else {
      if (page) page.scrollTop = 0;
      if (outline) outline.scrollTop = 0;
    }
    popped.current = false;
    if (first.current) {
      first.current = false;
      return;
    }
    const heading = page?.querySelector<HTMLElement>('h1');
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
    say(document.title);
  }, [pathname, say]);

  // ── Where you are in the page, and where to come back to ────────────────
  useEffect(() => {
    const page = pageScroller();
    if (!page) {
      setPosition('All');
      return;
    }
    let frame = 0;
    const follow = (): void => {
      const { scrollTop, scrollHeight, clientHeight } = page;
      scrolls.set(pathname, scrollTop);
      const room = scrollHeight - clientHeight;
      setPosition(
        room <= 1
          ? 'All'
          : scrollTop <= 0
            ? 'Top'
            : scrollTop >= room - 1
              ? 'Bot'
              : `${Math.round((scrollTop / room) * 100)}%`,
      );
    };
    const scrolled = (): void => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(follow);
    };
    follow();
    page.addEventListener('scroll', scrolled, { passive: true });
    const observer = new ResizeObserver(scrolled);
    observer.observe(page);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      page.removeEventListener('scroll', scrolled);
    };
  }, [pathname]);

  // ── The extras: when idle, or at the first key or press ─────────────────
  useEffect(() => {
    // Hydrated: for the tests, which wait for it. Nothing is styled from it.
    document.documentElement.dataset.siteShell = 'live';
    const load = (): void => setExtras(true);
    const cancel = idle(load);
    const events = ['keydown', 'pointerdown', 'focusin'] as const;
    for (const name of events) document.addEventListener(name, load, { once: true, capture: true });
    return () => {
      cancel();
      for (const name of events) document.removeEventListener(name, load, { capture: true });
    };
  }, []);

  const where = path.map((n) => n.title).join(' / ');

  return (
    <section className="site-status" aria-label="Status">
      <button
        type="button"
        className="rk-status-segment site-status-drawer"
        aria-controls="site-map"
        onClick={() => toggleDrawer()}
      >
        <Hint keys={'['} /> map
      </button>
      <span className="rk-status-segment" data-variant="mode">
        {modeOf(path)}
      </span>
      <span className="rk-status-segment site-status-where">
        <span className="site-hidden">You are at </span>
        {where}
      </span>
      <output className="site-status-message">
        {message.text === '' ? null : <span key={message.id}>{message.text}</span>}
      </output>
      <span className="rk-status-segment site-status-look">
        <LookButton part="theme" hint="t" value="sunset" />{' '}
        <LookButton part="mode" hint="m" value="system" />{' '}
        <LookButton part="density" hint="d" value="automatic" />
      </span>
      <span className="rk-status-segment site-status-copy">
        <button
          type="button"
          className="rk-button"
          aria-label="Copy the screen as text"
          data-site-copy="text"
        >
          <span className="rk-button-label">
            <Hint keys={'y'} /> copy
          </span>
        </button>{' '}
        <button
          type="button"
          className="rk-button"
          aria-label="Copy the screen as ANSI, for a terminal"
          data-site-copy="ANSI"
        >
          <span className="rk-button-label">
            <Hint keys={'Y'} /> ansi
          </span>
        </button>
      </span>
      <span className="rk-status-segment site-status-keys">
        <Hint keys={helping ? 'esc' : '?'} /> {helping ? 'back' : 'keys'}
      </span>
      <span className="rk-status-segment site-status-position">
        <span className="site-hidden">Position: </span>
        {position}
      </span>
      {extras ? (
        <Suspense fallback={null}>
          <Extras bindings={bindings} say={say} helping={helping} setHelping={setHelping} />
        </Suspense>
      ) : null}
    </section>
  );
}

/** A key, as KeyHint draws one inside a control: seen, not said; the control says what it does. */
function Hint({ keys }: { readonly keys: string }): ReactNode {
  return (
    <span className="rk-keyhint" aria-hidden="true">
      <kbd className="rk-keyhint-keys">{keys}</kbd>
    </span>
  );
}

/**
 * One of the look's buttons. Its value is written by the head's look before
 * the first paint (the script after the bar) and by the extras after, never
 * by React, which renders the site's own look and leaves the words alone.
 */
function LookButton({
  part,
  hint,
  value,
}: {
  readonly part: string;
  readonly hint: string;
  readonly value: string;
}): ReactNode {
  return (
    <button
      type="button"
      className="rk-button"
      aria-label={`${part[0]?.toUpperCase()}${part.slice(1)}: ${value}`}
      data-site-look={part}
      suppressHydrationWarning
    >
      <span className="rk-button-label">
        <Hint keys={hint} />{' '}
        <span data-site-look-value suppressHydrationWarning>
          {value}
        </span>
      </span>
    </button>
  );
}

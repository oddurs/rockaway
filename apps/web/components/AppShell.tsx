'use client';

import { GlyphProvider } from '@rockaway/react';
/**
 * The app shell (cairn 0104, rebuilt for Next): the system's Panes and
 * StatusBar around every page, mounted once in the root layout and never
 * again. A route change replaces the page pane's content and the outline,
 * and nothing else: the sidebar keeps its scroll and its state, the keys
 * stay bound, and the status bar says where you are.
 *
 * Every internal link is followed by the client router, whether it is a
 * `next/link` or a plain anchor in Markdown or the sidebar: the shell
 * catches the click. A link is fetched before it is followed, when it is
 * pointed at or focused. Every pane keeps its scroll per page, and back
 * returns to it. Each new page is announced and its heading focused, as a
 * page load would have done.
 */
import { Button } from '@rockaway/react/button';
import { screenAnsi, screenText } from '@rockaway/react/copy';
import { cellsIn, measureCell } from '@rockaway/react/dom';
import { KeyHint } from '@rockaway/react/key-hint';
import { attachKeymap, detectPlatform, KeymapEngine, KeymapHelp } from '@rockaway/react/keymap';
import { LinkTree, type LinkTreeItem } from '@rockaway/react/link-tree';
import { Pane, Panes } from '@rockaway/react/panes';
import { StatusBar, StatusMessage, StatusSegment } from '@rockaway/react/status-bar';
import { type Glyphs, themeGlyphs } from '@rockaway/tokens';
import type { Route } from 'next';
import { usePathname, useRouter } from 'next/navigation';
import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { DEFAULT_LOOK, type Look } from '../lib/look.ts';
import { lookSwitch } from '../lib/look-switch.ts';
import { modeOf, type NavNode, trail } from '../lib/nav.ts';
import { BASE } from '../lib/paths.ts';
import {
  type Action,
  type ShellBinding,
  STACK_BELOW,
  STATUS_SEGMENTS,
  shellSplit,
  sideBySide,
  stackedPage,
} from '../lib/shell.ts';

export interface AppShellProps {
  readonly nav: readonly NavNode[];
  readonly bindings: readonly ShellBinding[];
  /** The page's outline, from the `@outline` slot. */
  readonly outline: ReactNode;
  readonly children: ReactNode;
}

const segment = (name: (typeof STATUS_SEGMENTS)[number]['name']) => {
  const found = STATUS_SEGMENTS.find((s) => s.name === name);
  return {
    priority: found?.priority ?? 0,
    ...(found && 'align' in found ? { align: found.align } : {}),
  };
};

/** The tree's rows, with the base path a plain anchor needs. */
function items(nodes: readonly NavNode[]): LinkTreeItem[] {
  return nodes.map((node) => ({
    title: node.title,
    href: `${BASE}${node.href}`,
    ...(node.children ? { children: items(node.children) } : {}),
  }));
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

/** Where each page's panes were scrolled to, for back and forward. */
const scrolls = new Map<string, { page: number; outline: number }>();

export function AppShell({ nav, bindings, outline, children }: AppShellProps): ReactNode {
  const router = useRouter();
  // Every page's address ends in a slash, as the export writes it.
  const route = usePathname();
  const pathname = route.endsWith('/') ? route : `${route}/`;
  const shell = useRef<HTMLDivElement>(null);
  const main = useRef<HTMLElement>(null);
  const aside = useRef<HTMLElement>(null);

  // Initialize stacked based on the viewport width measured in the head script,
  // so hydration does not change the layout and cause shifts. The width is in
  // pixels; convert to cells assuming a 10px cell width (the standard for monospace).
  const initialStacked = (): boolean => {
    const width = typeof window !== 'undefined' && (window as any).rockawayViewportWidthPx;
    const cellWidth = 10; // Standard advance width for monospace at 16px font.
    return width ? Math.floor(width / cellWidth) < STACK_BELOW : false;
  };
  const [stacked, setStacked] = useState(initialStacked);
  const [sections, setSections] = useState(true);
  const [helping, setHelping] = useState(false);
  const [look, setLook] = useState<Look>(DEFAULT_LOOK);
  const [message, setMessage] = useState({ text: '', id: 0 });
  const [position, setPosition] = useState('Top');

  const say = useCallback((text: string): void => setMessage((m) => ({ text, id: m.id + 1 })), []);

  const path = trail(nav, pathname);
  const title = helping ? 'keys' : (path.at(-1)?.title ?? 'rockaway');
  const glyphs: Glyphs =
    (themeGlyphs as Readonly<Record<string, Glyphs>>)[look.theme] ?? themeGlyphs.default;

  // ── Layout: stacked under STACK_BELOW cells, measured on resize ────────
  useLayoutEffect(() => {
    const el = shell.current;
    if (!el) return;
    const layOut = (): void => {
      const newStacked = cellsIn(el.getBoundingClientRect().width, measureCell(el).width) < STACK_BELOW;
      // Only update stacked if it actually changed; this avoids unnecessary renders.
      setStacked((prev) => (prev !== newStacked ? newStacked : prev));
      setSections(aside.current?.querySelector('a[href]') !== null);
    };
    const observer = new ResizeObserver(layOut);
    observer.observe(el);
    // Mark the shell as live, so the CSS pre-paint layout rules stop applying
    // and the React-rendered layout takes over. This happens after the initial
    // measure, so React has already rendered with the correct stacked value.
    document.documentElement.dataset.rkShell = 'live';
    return () => observer.disconnect();
  }, []);

  // ── Navigation: every internal link through the router ─────────────────
  useEffect(() => {
    const root = shell.current;
    if (!root) return;
    const anchorOf = (event: Event) =>
      event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
    const click = (event: MouseEvent): void => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = anchorOf(event);
      const route = anchor ? routeOf(anchor) : undefined;
      if (!anchor || route === undefined) return;
      // A link to a place on this page is the browser's to follow.
      if (route.startsWith(`${pathname}#`)) return;
      event.preventDefault();
      router.push(route as Route, { scroll: false });
    };
    const prefetch = (event: Event): void => {
      const anchor = anchorOf(event);
      const route = anchor ? routeOf(anchor) : undefined;
      if (route !== undefined) router.prefetch(route.split('#')[0] as Route);
    };
    root.addEventListener('click', click);
    root.addEventListener('pointerover', prefetch);
    root.addEventListener('focusin', prefetch);
    return () => {
      root.removeEventListener('click', click);
      root.removeEventListener('pointerover', prefetch);
      root.removeEventListener('focusin', prefetch);
    };
  }, [router, pathname]);

  // ── Each page: its scroll back, its heading focused, its name said ──────
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
    const page = main.current;
    if (!page) return;
    setHelping(false);
    setSections(aside.current?.querySelector('a[href]') !== null);
    const saved = scrolls.get(pathname);
    if (popped.current && saved) {
      page.scrollTop = saved.page;
      if (aside.current) aside.current.scrollTop = saved.outline;
    } else if (location.hash) {
      document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
    } else {
      page.scrollTop = 0;
      if (aside.current) aside.current.scrollTop = 0;
    }
    popped.current = false;
    if (first.current) {
      first.current = false;
    } else {
      const heading = page.querySelector<HTMLElement>('h1');
      if (heading) {
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      }
      say(`${document.title}`);
    }
    return () => {
      scrolls.set(pathname, { page: page.scrollTop, outline: aside.current?.scrollTop ?? 0 });
    };
  }, [pathname, say]);

  // ── Where you are in the page ───────────────────────────────────────────
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new page is new content in the same pane: where it is starts again.
  useEffect(() => {
    const page = main.current;
    if (!page) return;
    let frame = 0;
    const follow = (): void => {
      const { scrollTop, scrollHeight, clientHeight } = page;
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
    return () => page.removeEventListener('scroll', scrolled);
  }, [pathname]);

  // ── The look, the copy and the keys ─────────────────────────────────────
  const looks = useRef<ReturnType<typeof lookSwitch> | null>(null);
  const pointed = useRef<HTMLElement | undefined>(undefined);
  useEffect(() => {
    const root = shell.current;
    const bar = root?.querySelector<HTMLElement>(':scope > .rk-statusbar');
    if (!root || !bar) return;
    looks.current = lookSwitch(bar, (chosen, said) => {
      setLook(chosen);
      say(said);
    });
    setLook(looks.current.current());

    const follows = (event: Event): void => {
      const el = event.target instanceof Element ? event.target : null;
      if (el?.closest('.rk-statusbar')) return;
      const screen = el?.closest<HTMLElement>('figure[role="img"], .rk-screen');
      pointed.current = screen && screen.parentElement !== root ? screen : undefined;
    };
    document.addEventListener('focusin', follows);
    document.addEventListener('pointerdown', follows);
    // A page's own script can say something on the message line too.
    const heard = (event: Event): void => {
      if (event instanceof CustomEvent && typeof event.detail === 'string') say(event.detail);
    };
    document.addEventListener('rk:say', heard);

    const copy = (as: 'text' | 'ANSI'): void => {
      const screen = pointed.current?.isConnected ? pointed.current : undefined;
      const from = screen ?? root;
      const text = screenText(from);
      const lines = text.split('\n');
      const cols = Math.max(0, ...lines.map((line) => [...line].length));
      const what = `${screen ? 'the screen' : 'the page'} as ${as}, ${lines.length} rows of ${cols} cells`;
      navigator.clipboard?.writeText(as === 'text' ? text : screenAnsi(from)).then(
        () => say(`Copied ${what}.`),
        () => say(`Could not copy ${what}: the browser did not allow it.`),
      );
    };
    for (const button of bar.querySelectorAll<HTMLElement>('[data-site-copy]')) {
      button.addEventListener('click', () =>
        copy(button.dataset.siteCopy === 'ANSI' ? 'ANSI' : 'text'),
      );
    }

    const page = (): HTMLElement | null => main.current;
    const row = (): number => {
      const height = Number.parseFloat(getComputedStyle(root).getPropertyValue('--rk-cell-height'));
      return Number.isFinite(height) && height > 0 ? height : 24;
    };
    const by = (rows: number) => () => page()?.scrollBy({ top: rows * row() });
    const screenful = (): number =>
      Math.max(1, Math.floor((page()?.clientHeight ?? 0) / row()) - 2);
    const actions: Record<Exclude<Action, `go:${string}`>, () => void> = {
      down: by(1),
      up: by(-1),
      'page-down': () => by(screenful())(),
      'page-up': () => by(-screenful())(),
      top: () => page()?.scrollTo({ top: 0 }),
      bottom: () => page()?.scrollTo({ top: page()?.scrollHeight ?? 0 }),
      help: () => setHelping((h) => !h),
      back: () => setHelping(false),
      'copy-text': () => copy('text'),
      'copy-ansi': () => copy('ANSI'),
      theme: () => looks.current?.theme(1),
      'theme-back': () => looks.current?.theme(-1),
      mode: () => looks.current?.mode(),
      density: () => looks.current?.density(),
    };
    const engine = new KeymapEngine();
    const scope = engine.scope(undefined);
    engine.mount(scope);
    engine.setPlatform(detectPlatform(navigator));
    for (const binding of bindings) {
      engine.register(scope, {
        keys: binding.keys,
        description: binding.description,
        action: binding.action.startsWith('go:')
          ? () => router.push(binding.action.slice(3) as Route)
          : actions[binding.action as keyof typeof actions],
      });
    }
    // Space and Enter on a control are the control's.
    const own = (event: KeyboardEvent): void => {
      if (event.key !== ' ' && event.key !== 'Enter') return;
      const at = event.target instanceof Element ? event.target : null;
      if (at?.closest('button, a[href], summary, [role="button"], input, select, textarea')) {
        event.stopImmediatePropagation();
      }
    };
    document.addEventListener('keydown', own);
    const detach = attachKeymap(engine, document);
    return () => {
      document.removeEventListener('focusin', follows);
      document.removeEventListener('pointerdown', follows);
      document.removeEventListener('keydown', own);
      document.removeEventListener('rk:say', heard);
      if (typeof detach === 'function') detach();
    };
  }, [bindings, router, say]);

  const split = shellSplit({ stacked, title, outline: sections && !helping });
  // Where each pane goes before the script has measured the window (globals.css).
  const side = sideBySide({ title, outline: true });
  const narrow = sideBySide({ title, outline: false });
  const phone = stackedPage({ title, outline: true });
  const early = {
    '--site-early-x': phone.x,
    '--site-early-y': phone.y,
    '--site-early-less-cols': phone.lessCols,
    '--site-early-less-rows': phone.lessRows,
    '--site-side-y': side.page.y,
    '--site-side-less-rows': side.page.lessRows,
    '--site-side-map-x': side.map.x,
    '--site-side-map-cols': side.map.cols,
    '--site-side-page-x': side.page.x,
    '--site-side-page-less-cols': side.page.lessCols,
    '--site-side-outline-from-end': side.outline?.fromEnd,
    '--site-side-outline-cols': side.outline?.cols,
    '--site-narrow-page-less-cols': narrow.page.lessCols,
  } as CSSProperties;
  const [mapSpec, pageSpec, outlineSpec] = split.panes;

  return (
    <GlyphProvider glyphs={glyphs}>
      <div className="site-shell" ref={shell} style={early}>
        <Panes
          direction={stacked ? 'column' : 'row'}
          fallback={{ width: side.from, height: side.rows }}
        >
          <Pane {...mapSpec} label="" pad={0}>
            <nav aria-label="Site" className="rk-scroll site-scroll" data-site-map>
              <LinkTree items={items(nav)} current={`${BASE}${pathname}`} />
            </nav>
          </Pane>
          <Pane {...pageSpec} label="" pad={0}>
            <main id="content" ref={main} tabIndex={-1} className="rk-scroll site-scroll site-page">
              <div data-site-page hidden={helping}>
                {children}
              </div>
              {helping ? (
                <section aria-labelledby="site-keys" className="rk-prose">
                  <h1 id="site-keys">Keys</h1>
                  <KeymapHelp bindings={bindings} platform="other" />
                </section>
              ) : null}
            </main>
          </Pane>
          <Pane {...outlineSpec} label="" pad={0}>
            <aside
              aria-label="On this page"
              ref={aside}
              className="rk-scroll site-scroll"
              data-site-outline
            >
              {outline}
            </aside>
          </Pane>
        </Panes>
        <StatusBar label="Status">
          <StatusSegment variant="mode" {...segment('mode')}>
            {modeOf(path)}
          </StatusSegment>
          <StatusSegment {...segment('where')} label="You are at">
            {path.map((n) => n.title).join(' / ')}
          </StatusSegment>
          <StatusMessage id={message.id}>{message.text}</StatusMessage>
          <StatusSegment {...segment('look')} label="Look">
            <Button delimiters="none" aria-label={`Theme: ${look.theme}`} data-site-look="theme">
              <KeyHint keys="t" notation="terminal" decorative />{' '}
              <span data-site-look-value>{look.theme}</span>
            </Button>{' '}
            <Button delimiters="none" aria-label={`Mode: ${look.mode}`} data-site-look="mode">
              <KeyHint keys="m" notation="terminal" decorative />{' '}
              <span data-site-look-value>{look.mode}</span>
            </Button>{' '}
            <Button
              delimiters="none"
              aria-label={`Density: ${look.density}`}
              data-site-look="density"
            >
              <KeyHint keys="d" notation="terminal" decorative />{' '}
              <span data-site-look-value>{look.density}</span>
            </Button>
          </StatusSegment>
          <StatusSegment {...segment('copy')} label="Copy">
            <Button delimiters="none" aria-label="Copy the screen as text" data-site-copy="text">
              <KeyHint keys="y" notation="terminal" decorative /> copy
            </Button>{' '}
            <Button
              delimiters="none"
              aria-label="Copy the screen as ANSI, for a terminal"
              data-site-copy="ANSI"
            >
              <KeyHint keys="shift+y" notation="terminal" decorative /> ansi
            </Button>
          </StatusSegment>
          <StatusSegment {...segment('keys')}>
            <KeyHint keys={helping ? 'esc' : '?'} platform="other">
              {helping ? 'back' : 'keys'}
            </KeyHint>
          </StatusSegment>
          <StatusSegment {...segment('position')} label="Position">
            {position}
          </StatusSegment>
        </StatusBar>
      </div>
    </GlyphProvider>
  );
}

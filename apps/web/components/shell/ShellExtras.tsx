'use client';

/**
 * The shell's extras (cairn 0104, 0148, 0287): the keys, the look, the copy,
 * the help and the map's own keys and filter. Loaded after the page is up,
 * when the browser is idle or at the first key or press, so no page waits
 * for any of it; nothing here changes where anything is.
 */
import { attachKeymap, detectPlatform, KeymapEngine } from '@rockaway/react/keymap';
import type { Route } from 'next';
import { usePathname, useRouter } from 'next/navigation';
import { lazy, type ReactNode, Suspense, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { type LookSwitch, lookSwitch } from '../../lib/look-switch.ts';
import type { Action, ShellBinding } from '../../lib/shell.ts';
import {
  paneHidden,
  syncSections,
  toggleDrawer,
  togglePane,
  toggleSection,
} from '../../lib/shell-state.ts';
import { pageScroller } from './Shell.tsx';

/** The help draws with the system's components: loaded at the first `?`. */
const HelpScreen = lazy(() =>
  import('./HelpScreen.tsx').then((module) => ({ default: module.HelpScreen })),
);

export interface ShellExtrasProps {
  readonly bindings: readonly ShellBinding[];
  readonly say: (text: string) => void;
  readonly helping: boolean;
  readonly setHelping: (helping: boolean | ((was: boolean) => boolean)) => void;
}

const map = (): HTMLElement | null => document.querySelector<HTMLElement>('.site-map');

/** The map's links a reader can see: not in a shut section, not filtered out. */
function mapLinks(): HTMLElement[] {
  const root = map();
  if (!root) return [];
  return [...root.querySelectorAll<HTMLElement>('.rk-link-tree-link')].filter(
    (link) => link.getClientRects().length > 0,
  );
}

/** The section a row of the map is in, or is. */
const sectionOf = (el: Element | null): string | undefined =>
  el?.closest<HTMLElement>('[data-site-section]')?.dataset.siteSection;

export function ShellExtras({ bindings, say, helping, setHelping }: ShellExtrasProps): ReactNode {
  const router = useRouter();
  const looks = useRef<LookSwitch | null>(null);
  const [filtering, setFiltering] = useState(false);
  const pathname = usePathname();

  // ── The outline marks the section you are reading ───────────────────────
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new page is new sections.
  useEffect(() => {
    const page = pageScroller();
    const outline = document.querySelector<HTMLElement>('.site-outline');
    if (!page || !outline) return;
    const links = new Map(
      [...outline.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')].map((a) => [
        decodeURIComponent(a.getAttribute('href')?.slice(1) ?? ''),
        a,
      ]),
    );
    const headings = [...page.querySelectorAll<HTMLElement>('h2[id], h3[id]')].filter((h) =>
      links.has(h.id),
    );
    if (headings.length === 0) return;
    let frame = 0;
    const mark = (): void => {
      // The last section to have started above the top third of the pane.
      const line = page.getBoundingClientRect().top + page.clientHeight / 3;
      const at = headings.filter((h) => h.getBoundingClientRect().top <= line).at(-1);
      for (const [id, link] of links) {
        if (id === at?.id) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      }
    };
    const scrolled = (): void => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(mark);
    };
    mark();
    page.addEventListener('scroll', scrolled, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      page.removeEventListener('scroll', scrolled);
    };
  }, [pathname]);

  // ── The look, the copy, the map's sections ──────────────────────────────
  useEffect(() => {
    document.documentElement.dataset.siteExtras = '';
    const bar = document.querySelector<HTMLElement>('.site-status');
    if (!bar) return;
    looks.current = lookSwitch(bar, (_look, said) => say(said));
    syncSections();
    const toggled = (event: MouseEvent): void => {
      const button =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>('[data-site-toggle]')
          : null;
      const id = button?.dataset.siteToggle;
      if (!id) return;
      const open = toggleSection(id);
      say(`${button.getAttribute('aria-label')?.split(':')[0]}: ${open ? 'open' : 'shut'}.`);
    };
    document.addEventListener('click', toggled);
    return () => document.removeEventListener('click', toggled);
  }, [say]);

  // ── The keys ────────────────────────────────────────────────────────────
  useEffect(() => {
    const shell = document.querySelector<HTMLElement>('.site-shell');
    if (!shell) return;
    /** Where copy reads from: the screen last pointed at or focused, or the whole shell. */
    let pointed: HTMLElement | undefined;
    const follows = (event: Event): void => {
      const el = event.target instanceof Element ? event.target : null;
      if (el?.closest('.site-status')) return;
      const screen = el?.closest<HTMLElement>('#content figure[role="img"], #content .rk-screen');
      pointed = screen ?? undefined;
    };
    document.addEventListener('focusin', follows);
    document.addEventListener('pointerdown', follows);
    const heard = (event: Event): void => {
      if (event instanceof CustomEvent && typeof event.detail === 'string') say(event.detail);
    };
    document.addEventListener('rk:say', heard);

    const copy = (as: 'text' | 'ANSI'): void => {
      const screen = pointed?.isConnected ? pointed : undefined;
      const from = screen ?? shell;
      // The reader of screens is loaded the first time something is copied.
      void import('@rockaway/react/copy').then(({ screenAnsi, screenText }) => {
        const text = screenText(from);
        const lines = text.split('\n');
        const cols = Math.max(0, ...lines.map((line) => [...line].length));
        const what = `${screen ? 'the screen' : 'the page'} as ${as}, ${lines.length} rows of ${cols} cells`;
        navigator.clipboard?.writeText(as === 'text' ? text : screenAnsi(from)).then(
          () => say(`Copied ${what}.`),
          () => say(`Could not copy ${what}: the browser did not allow it.`),
        );
      });
    };
    const copied = (event: MouseEvent): void => {
      const button =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>('[data-site-copy]')
          : null;
      if (button) copy(button.dataset.siteCopy === 'ANSI' ? 'ANSI' : 'text');
    };
    document.addEventListener('click', copied);
    // The toolbar asks; the shell does (ShellToolbar.tsx).
    const asked = (event: Event): void => {
      if (!(event instanceof CustomEvent)) return;
      if (event.type === 'rk:copy') copy(event.detail === 'ANSI' ? 'ANSI' : 'text');
      if (event.type === 'rk:help') setHelping((h) => !h);
      if (event.type === 'rk:look-set') {
        const { part, value } = event.detail as {
          part: 'theme' | 'mode' | 'density';
          value: string;
        };
        looks.current?.set(part, value);
      }
    };
    for (const name of ['rk:copy', 'rk:help', 'rk:look-set'])
      document.addEventListener(name, asked);

    const row = (): number => {
      const height = Number.parseFloat(
        getComputedStyle(shell).getPropertyValue('--rk-cell-height'),
      );
      // `1lh` until a screen measures it: the shell's own line box.
      return Number.isFinite(height) && height > 0
        ? height
        : Number.parseFloat(getComputedStyle(shell).lineHeight) || 24;
    };
    const inMap = (): boolean => document.activeElement?.closest('.site-map') != null;
    /** In the map, j and k move between its rows; anywhere else, they scroll the page. */
    const step = (by: number) => (): void => {
      if (inMap()) {
        const links = mapLinks();
        const at = links.indexOf(document.activeElement as HTMLElement);
        links[Math.max(0, Math.min(links.length - 1, at + by))]?.focus();
        return;
      }
      pageScroller()?.scrollBy({ top: by * row() });
    };
    const screenful = (): number =>
      Math.max(1, Math.floor((pageScroller()?.clientHeight ?? 0) / row()) - 2);
    /** ← shuts the section the focused row is in, and goes to its row; → opens it. */
    const fold = (open: boolean) => (): void => {
      if (!inMap()) return;
      const id = sectionOf(document.activeElement);
      if (!id) return;
      toggleSection(id, open);
      if (!open) {
        document
          .querySelector<HTMLElement>(
            `[data-site-section="${id}"] > .rk-link-tree-row .rk-link-tree-link`,
          )
          ?.focus();
      }
    };
    const toMap = (): void => {
      if (paneHidden('map')) togglePane('map');
      if (getComputedStyle(map() ?? document.body).display === 'none') toggleDrawer(true);
      const links = mapLinks();
      (links.find((link) => link.getAttribute('aria-current')) ?? links[0])?.focus();
    };
    const actions: Record<Exclude<Action, `go:${string}`>, () => void> = {
      down: step(1),
      up: step(-1),
      'page-down': () => pageScroller()?.scrollBy({ top: screenful() * row() }),
      'page-up': () => pageScroller()?.scrollBy({ top: -screenful() * row() }),
      top: () => pageScroller()?.scrollTo({ top: 0 }),
      bottom: () => pageScroller()?.scrollTo({ top: pageScroller()?.scrollHeight ?? 0 }),
      help: () => setHelping((h) => !h),
      back: () => {
        setHelping(false);
        setFiltering(false);
        toggleDrawer(false);
      },
      'copy-text': () => copy('text'),
      'copy-ansi': () => copy('ANSI'),
      theme: () => looks.current?.theme(1),
      'theme-back': () => looks.current?.theme(-1),
      mode: () => looks.current?.mode(),
      density: () => looks.current?.density(),
      map: toMap,
      'map-toggle': () => {
        // On a phone, the map is a drawer; anywhere else, a pane that hides.
        const drawer =
          getComputedStyle(document.documentElement).getPropertyValue('--site-drawer').trim() ===
          '1';
        if (drawer) say(toggleDrawer() ? 'Map: open.' : 'Map: closed.');
        else say(togglePane('map') ? 'Map: shown.' : 'Map: hidden.');
      },
      'outline-toggle': () => say(togglePane('outline') ? 'Outline: shown.' : 'Outline: hidden.'),
      filter: () => {
        toMap();
        setFiltering(true);
      },
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
    engine.register(scope, {
      keys: 'left',
      description: 'Shut a section of the map',
      action: fold(false),
    });
    engine.register(scope, {
      keys: 'right',
      description: 'Open a section of the map',
      action: fold(true),
    });
    engine.register(scope, { keys: 'esc', description: 'Back to the page', action: actions.back });
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
      document.removeEventListener('click', copied);
      for (const name of ['rk:copy', 'rk:help', 'rk:look-set']) {
        document.removeEventListener(name, asked);
      }
      if (typeof detach === 'function') detach();
    };
  }, [bindings, router, say, setHelping]);

  const content = typeof document === 'undefined' ? null : document.getElementById('content');
  const slot =
    typeof document === 'undefined' ? null : document.querySelector('[data-site-filter]');
  return (
    <>
      {helping && content
        ? createPortal(
            <Suspense fallback={null}>
              <HelpScreen bindings={bindings} />
            </Suspense>,
            content,
          )
        : null}
      {filtering && slot
        ? createPortal(<Filter done={() => setFiltering(false)} say={say} />, slot)
        : null}
    </>
  );
}

/**
 * Find a page in the map (0287): a line at the map's top, and the rows that
 * do not match hidden as you type. Enter goes to the first that does; Escape
 * puts the map back.
 */
function Filter({
  done,
  say,
}: {
  readonly done: () => void;
  readonly say: (text: string) => void;
}): ReactNode {
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  useEffect(() => {
    input.current?.focus();
  }, []);
  useEffect(() => {
    const root = map();
    if (!root) return;
    const needle = query.trim().toLowerCase();
    let shown = 0;
    for (const item of root.querySelectorAll<HTMLElement>('.rk-link-tree-item')) {
      const own =
        item.querySelector(':scope > .rk-link-tree-row')?.textContent?.toLowerCase() ?? '';
      const below =
        item.querySelector(':scope > .rk-link-tree-group')?.textContent?.toLowerCase() ?? '';
      const match = needle === '' || own.includes(needle) || below.includes(needle);
      item.toggleAttribute('data-site-filtered', !match);
      if (match && own.includes(needle) && needle !== '') shown += 1;
    }
    root.toggleAttribute('data-site-filtering', needle !== '');
    if (needle !== '') say(`${shown} ${shown === 1 ? 'page' : 'pages'} match.`);
  }, [query, say]);
  useEffect(
    () => () => {
      const root = map();
      root?.removeAttribute('data-site-filtering');
      for (const item of root?.querySelectorAll('[data-site-filtered]') ?? []) {
        item.removeAttribute('data-site-filtered');
      }
    },
    [],
  );
  return (
    <label className="site-filter">
      <span aria-hidden="true">/</span>
      <input
        ref={input}
        type="search"
        aria-label="Find a page"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            done();
          } else if (event.key === 'Enter') {
            event.preventDefault();
            // The first page whose own name matches, not a section shown for one inside it.
            const needle = query.trim().toLowerCase();
            const first = mapLinks().find(
              (link) =>
                link.tagName === 'A' && (link.textContent ?? '').toLowerCase().includes(needle),
            ) as HTMLAnchorElement | undefined;
            if (first) {
              done();
              first.click();
            }
          } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            mapLinks()[0]?.focus();
          }
        }}
        onBlur={(event) => {
          if (query === '' && !event.relatedTarget?.closest?.('.site-map')) done();
        }}
      />
    </label>
  );
}

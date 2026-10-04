/**
 * The site's shell (cairn 0104): every page, as a TUI.
 *
 * Three panes share their borders: the site's map, the page and its outline.
 * Under them, the status bar says where you are and what the keys do. All of
 * it is `@rockaway/react`; the shell only decides what goes where.
 *
 *   - It is a website first. Every row of the map and of the outline is a
 *     link, every `g` jump is a row of the map, and with no script the panes
 *     become a plain document (the `scripting: none` rules in `site.css`).
 *   - The URL is the state. The map's current row is the page's path, and the
 *     section you have scrolled to is the fragment, so any place is a link.
 *   - The page is the slot: Markdown set by `.rk-prose` and rendered by
 *     Astro, scrolled inside the content pane with no native scrollbar.
 *
 * The panes stack when the screen is too narrow for them side by side, and
 * the outline is the first to go when there is no room for it.
 */
import { cellsIn, measureCell } from '@rockaway/react';
import { Button } from '@rockaway/react/button';
import { screenAnsi, screenText } from '@rockaway/react/copy';
import { KeyHint } from '@rockaway/react/key-hint';
import { Keymap, KeymapHelp, useKeymap } from '@rockaway/react/keymap';
import { Pane, Panes } from '@rockaway/react/panes';
import { StatusBar, StatusMessage, StatusSegment } from '@rockaway/react/status-bar';
import { NavigationTree, NavigationTreeItem } from '@rockaway/react/tree';
import {
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import type { Jump, NavNode } from '../lib/nav.ts';
import type { Heading } from '../lib/outline.ts';

export interface ShellProps {
  /** The site's map. */
  readonly nav: readonly NavNode[];
  /** This page's `href`, as the map has it. */
  readonly current: string;
  /** The rows of the map from the top down to this page, for the status bar. */
  readonly trail: readonly string[];
  /** The section the page is in, for the mode segment: `FOUNDATIONS`. */
  readonly section: string;
  /** What the content pane's border says. */
  readonly title: string;
  readonly headings: readonly Heading[];
  readonly jumps: readonly Jump[];
  /** The page: Astro's slot. */
  readonly children?: ReactNode;
}

/** Narrower than this, in cells, and the panes stack. */
const STACK_BELOW = 64;

/** Where the reader is in the page: what the status bar and the outline show. */
interface Place {
  /** `Top`, `Bot`, `All` or a percentage, as a pager says it. */
  readonly position: string;
  /** The id of the section at the top of the pane, if any. */
  readonly section: string | undefined;
}

interface PlaceStore {
  readonly get: () => Place;
  readonly set: (place: Place) => void;
  readonly subscribe: (listener: () => void) => () => void;
}

function placeStore(): PlaceStore {
  let place: Place = { position: 'Top', section: undefined };
  const listeners = new Set<() => void>();
  return {
    get: () => place,
    set: (next) => {
      if (next.position === place.position && next.section === place.section) return;
      place = next;
      for (const listener of listeners) listener();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

const SERVER_PLACE: Place = { position: 'Top', section: undefined };

/** Runs before paint in a browser, and not at all on a server. */
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** The width of `el` in cells, once it has been laid out; `undefined` until then. */
function useCols(el: RefObject<HTMLElement | null>): number | undefined {
  const [cols, setCols] = useState<number | undefined>(undefined);
  useIsomorphicLayoutEffect(() => {
    const host = el.current;
    if (!host) return;
    const measure = (): void => {
      const cell = measureCell(host);
      setCols(cellsIn(host.getBoundingClientRect().width, cell.width));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    return () => observer.disconnect();
  }, [el]);
  return cols;
}

/** One row of the screen, in pixels, read from the screen the element is in. */
function rowOf(el: HTMLElement): number {
  const screen = el.closest<HTMLElement>('.rk-screen') ?? el;
  const height = Number.parseFloat(getComputedStyle(screen).getPropertyValue('--rk-cell-height'));
  return Number.isFinite(height) && height > 0 ? height : 24;
}

/** Where `scroller` is, as a pager says it, and which section is at its top. */
function placeIn(scroller: HTMLElement, headings: readonly Heading[]): Place {
  const { scrollTop, scrollHeight, clientHeight } = scroller;
  const room = scrollHeight - clientHeight;
  const position =
    room <= 1
      ? 'All'
      : scrollTop <= 0
        ? 'Top'
        : scrollTop >= room - 1
          ? 'Bot'
          : `${Math.round((scrollTop / room) * 100)}%`;
  const top = scroller.getBoundingClientRect().top + rowOf(scroller) * 2;
  let section: string | undefined;
  for (const heading of headings) {
    const el = document.getElementById(heading.id);
    if (!el || el.getBoundingClientRect().top > top) break;
    section = heading.id;
  }
  return { position, section };
}

/** The map, a row per page. */
function MapRows({ nodes }: { readonly nodes: readonly NavNode[] }): ReactNode {
  return nodes.map((node) => (
    <NavigationTreeItem key={node.id} id={node.id} title={node.title} href={node.href}>
      {node.children === undefined ? null : <MapRows nodes={node.children} />}
    </NavigationTreeItem>
  ));
}

/** The outline as tree rows: each section, and the sections within it. */
function OutlineRows({ headings }: { readonly headings: readonly Heading[] }): ReactNode {
  const sections: { heading: Heading; within: Heading[] }[] = [];
  for (const heading of headings) {
    const last = sections.at(-1);
    if (heading.depth === 3 && last !== undefined) last.within.push(heading);
    else sections.push({ heading, within: [] });
  }
  return sections.map(({ heading, within }) => (
    <NavigationTreeItem
      key={heading.id}
      id={heading.id}
      title={heading.text}
      href={`#${heading.id}`}
    >
      {within.map((h) => (
        <NavigationTreeItem key={h.id} id={h.id} title={h.text} href={`#${h.id}`} />
      ))}
    </NavigationTreeItem>
  ));
}

/** The status bar: where you are, how far down, and what the keys do. */
function Status({
  store,
  trail,
  mode,
  headings,
  help,
  message,
  copy,
}: {
  readonly store: PlaceStore;
  readonly trail: readonly string[];
  readonly mode: string;
  readonly headings: readonly Heading[];
  readonly help: boolean;
  readonly message: { readonly id: number; readonly text: string } | undefined;
  readonly copy: (as: CopyAs) => void;
}): ReactNode {
  const place = useSyncExternalStore(store.subscribe, store.get, () => SERVER_PLACE);
  const section = headings.find((h) => h.id === place.section)?.text;
  const where = [...trail, ...(section === undefined ? [] : [section])].join(' / ');
  return (
    <StatusBar label="Status">
      <StatusSegment variant="mode" priority={4}>
        {help ? 'KEYS' : mode}
      </StatusSegment>
      <StatusSegment priority={1} label="You are at">
        {where}
      </StatusSegment>
      <StatusMessage {...(message === undefined ? {} : { id: message.id })}>
        {message?.text}
      </StatusMessage>
      <StatusSegment align="end" priority={0} label="Copy">
        <Button
          delimiters="none"
          keys="y"
          aria-label="Copy the screen as text"
          onPress={() => copy('text')}
        >
          copy
        </Button>{' '}
        <Button
          delimiters="none"
          keys="shift+y"
          aria-label="Copy the screen as ANSI, for a terminal"
          onPress={() => copy('ANSI')}
        >
          ansi
        </Button>
      </StatusSegment>
      <StatusSegment align="end" priority={2}>
        {help ? <KeyHint keys="esc">back</KeyHint> : <KeyHint keys="?">keys</KeyHint>}
      </StatusSegment>
      <StatusSegment align="end" priority={3} label="Position">
        {help ? 'All' : place.position}
      </StatusSegment>
    </StatusBar>
  );
}

type CopyAs = 'text' | 'ANSI';

/**
 * The screen a copy takes: the one you last pointed at or moved into (a
 * snapshot, an example), or the whole page. The status bar is where the copy
 * is pressed, so going there forgets nothing.
 */
const SCREEN = 'figure[role="img"], .rk-screen';

function screenUnder(el: Element | null, shell: HTMLElement): HTMLElement | undefined {
  const screen = el?.closest<HTMLElement>(SCREEN);
  // The shell's own screens are the page, which is what it copies anyway.
  if (!screen || screen.parentElement === shell) return undefined;
  return screen;
}

/** What a screen is called in the message that says it was copied. */
function nameOf(screen: HTMLElement | undefined): string {
  if (screen === undefined) return 'the page';
  const label = screen.getAttribute('aria-label');
  if (screen.matches('figure') && label) return `“${label.replace(/, as text$/, '')}”`;
  if (screen.closest('astro-island[component-export="Example"]')) return 'the example';
  return label ? `“${label}”` : 'the screen';
}

/** Copies the screen you are on, and says what it copied in the status bar. */
function useCopy(
  shell: RefObject<HTMLElement | null>,
  say: (text: string) => void,
): (as: CopyAs) => void {
  const target = useRef<HTMLElement | undefined>(undefined);
  useEffect(() => {
    const host = shell.current;
    if (!host) return;
    const follow = (event: Event): void => {
      const el = event.target instanceof Element ? event.target : null;
      if (el?.closest('.rk-statusbar')) return;
      // A click on a pane's page focuses the page, after the pointer has
      // already said what was clicked: that focus says nothing new.
      if (event.type === 'focusin' && el?.getAttribute('tabindex') === '-1') return;
      target.current = screenUnder(el, host);
    };
    document.addEventListener('focusin', follow);
    document.addEventListener('pointerdown', follow);
    return () => {
      document.removeEventListener('focusin', follow);
      document.removeEventListener('pointerdown', follow);
    };
  }, [shell]);
  return useCallback(
    (as: CopyAs) => {
      const host = shell.current;
      const screen = target.current?.isConnected ? target.current : undefined;
      const from = screen ?? host;
      if (!from) return;
      const text = as === 'text' ? screenText(from) : screenAnsi(from);
      const lines = screenText(from).split('\n');
      const cols = Math.max(0, ...lines.map((line) => [...line].length));
      const what = `${nameOf(screen)} as ${as}, ${lines.length} rows of ${cols} cells`;
      if (!navigator.clipboard) {
        say(`Could not copy ${what}: this page cannot reach the clipboard.`);
        return;
      }
      navigator.clipboard.writeText(text).then(
        () => say(`Copied ${what}.${as === 'ANSI' ? ' Paste it into a terminal.' : ''}`),
        () => say(`Could not copy ${what}: the browser did not allow it.`),
      );
    },
    [shell, say],
  );
}

/** The page's keys, bound once for the whole page. */
function Keys({
  scroller,
  jumps,
  help,
  setHelp,
  copy,
}: {
  readonly scroller: RefObject<HTMLElement | null>;
  readonly jumps: readonly Jump[];
  readonly help: boolean;
  readonly setHelp: (open: boolean) => void;
  readonly copy: (as: CopyAs) => void;
}): ReactNode {
  const by = useCallback(
    (rows: (el: HTMLElement) => number) => () => {
      const el = scroller.current;
      if (el) el.scrollBy({ top: rows(el) * rowOf(el) });
    },
    [scroller],
  );
  const page = (el: HTMLElement): number =>
    Math.max(1, Math.floor(el.clientHeight / rowOf(el)) - 2);
  useKeymap([
    { keys: 'j', description: 'Down a line', action: by(() => 1) },
    { keys: 'k', description: 'Up a line', action: by(() => -1) },
    { keys: 'down', description: 'Down a line', action: by(() => 1) },
    { keys: 'up', description: 'Up a line', action: by(() => -1) },
    { keys: 'space', description: 'Down a screen', action: by((el) => page(el)) },
    { keys: 'shift+space', description: 'Up a screen', action: by((el) => -page(el)) },
    {
      keys: 'g g',
      description: 'To the top',
      action: () => scroller.current?.scrollTo({ top: 0 }),
    },
    {
      // `shift+g` rather than `G`, which the keymap reads as `g`.
      keys: 'shift+g',
      description: 'To the bottom',
      action: () => {
        const el = scroller.current;
        if (el) el.scrollTo({ top: el.scrollHeight });
      },
    },
    ...jumps.map((jump) => ({
      keys: `g ${jump.key}`,
      description: jump.title,
      action: () => window.location.assign(jump.href),
    })),
    { keys: 'y', description: 'Copy the screen as text', action: () => copy('text') },
    {
      keys: 'shift+y',
      description: 'Copy the screen as ANSI, for a terminal',
      action: () => copy('ANSI'),
    },
    { keys: '?', description: 'These keys', action: () => setHelp(!help) },
  ]);
  useKeymap([{ keys: 'esc', description: 'Back to the page', action: () => setHelp(false) }], {
    enabled: help,
  });
  return null;
}

export function Shell({
  nav,
  current,
  trail,
  section,
  title,
  headings,
  jumps,
  children,
}: ShellProps): ReactNode {
  const host = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLElement>(null);
  const cols = useCols(host);
  const stacked = cols !== undefined && cols < STACK_BELOW;
  const store = useMemo(placeStore, []);
  const [help, setHelpState] = useState(false);
  const [message, setMessage] = useState<{ id: number; text: string } | undefined>(undefined);
  const setHelp = useCallback((open: boolean) => {
    setHelpState(open);
    setMessage((was) => ({
      id: (was?.id ?? 0) + 1,
      text: open ? 'The keys. Esc goes back to the page.' : 'Back to the page.',
    }));
  }, []);
  const place = useSyncExternalStore(store.subscribe, store.get, () => SERVER_PLACE);
  const say = useCallback(
    (text: string) => setMessage((was) => ({ id: (was?.id ?? 0) + 1, text })),
    [],
  );
  const copy = useCopy(host, say);

  // A page's own script can say something on the message line too.
  useEffect(() => {
    const listen = (event: Event): void => {
      if (event instanceof CustomEvent && typeof event.detail === 'string') say(event.detail);
    };
    document.addEventListener('rk:say', listen);
    return () => document.removeEventListener('rk:say', listen);
  }, [say]);

  // The shell is live: the panes are laid out at the screen's real size.
  useIsomorphicLayoutEffect(() => {
    document.documentElement.dataset.rkShell = 'live';
  }, []);

  // The map opens at the page you are on, in the middle of its pane if it
  // has to scroll, and without scrolling anything outside the pane.
  const map = useRef<HTMLElement>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: again when the panes stack or unstack, which resizes the map's pane.
  useEffect(() => {
    const el = map.current;
    const row = el?.querySelector<HTMLElement>('[aria-current="page"]')?.closest('[role="row"]');
    if (!el || !row) return;
    const offset = row.getBoundingClientRect().top - el.getBoundingClientRect().top;
    el.scrollTop += offset - (el.clientHeight - row.getBoundingClientRect().height) / 2;
  }, [stacked]);

  // Follow the scroll: the status bar's position, the outline's current row,
  // and the fragment, so the address is always where you are.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    let frame = 0;
    let scrolled = false;
    const update = (): void => {
      const next = placeIn(el, headings);
      if (scrolled && next.section !== store.get().section) {
        const hash = next.section === undefined ? '' : `#${next.section}`;
        history.replaceState(history.state, '', `${location.pathname}${location.search}${hash}`);
      }
      store.set(next);
    };
    const onScroll = (): void => {
      scrolled = true;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    // A fragment in the address is a place in the page: go there once the
    // panes have their real size, which moves everything from where the
    // server put it.
    frame = requestAnimationFrame(() => {
      const target = location.hash
        ? document.getElementById(decodeURIComponent(location.hash.slice(1)))
        : null;
      target?.scrollIntoView({ block: 'start' });
      update();
    });
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener('scroll', onScroll);
    };
  }, [headings, store]);

  const expanded = useMemo(
    () => nav.filter((node) => node.children?.some((c) => c.href === current)).map((n) => n.id),
    [nav, current],
  );
  const outlineExpanded = useMemo(
    () => headings.filter((h) => h.depth === 2).map((h) => h.id),
    [headings],
  );
  const showOutline = !stacked && headings.length > 0;

  return (
    <Keymap>
      <Keys scroller={scroller} jumps={jumps} help={help} setHelp={setHelp} copy={copy} />
      <div ref={host} className="site-shell">
        <Panes direction={stacked ? 'column' : 'row'} fallback={{ width: 120, height: 40 }}>
          <Pane
            title="rockaway"
            label=""
            size={stacked ? 6 : 26}
            min={stacked ? 3 : 18}
            priority={2}
            pad={0}
          >
            <nav aria-label="Site" className="rk-scroll site-scroll" ref={map}>
              <NavigationTree aria-label="Pages" current={current} defaultExpandedKeys={expanded}>
                <MapRows nodes={nav} />
              </NavigationTree>
            </nav>
          </Pane>
          <Pane
            title={help ? 'keys' : title}
            label=""
            size="1fr"
            min={stacked ? 6 : 36}
            priority={3}
            pad={0}
          >
            <main
              id="content"
              tabIndex={-1}
              className="rk-scroll site-scroll site-page"
              ref={scroller}
            >
              <div hidden={help}>{children}</div>
              {help ? (
                <section aria-labelledby="site-keys" className="rk-prose">
                  <h1 id="site-keys">Keys</h1>
                  <p>
                    Each of these is a shortcut for something on the screen: a scroll of this pane,
                    or a row of the map, which is a link.
                  </p>
                  <KeymapHelp />
                </section>
              ) : null}
            </main>
          </Pane>
          {showOutline ? (
            <Pane title="on this page" label="" size={28} min={18} priority={1} pad={0}>
              <aside aria-label="On this page" className="rk-scroll site-scroll">
                <NavigationTree
                  aria-label="Sections"
                  defaultExpandedKeys={outlineExpanded}
                  {...(place.section === undefined ? {} : { current: `#${place.section}` })}
                >
                  <OutlineRows headings={headings} />
                </NavigationTree>
              </aside>
            </Pane>
          ) : null}
        </Panes>
        <Status
          store={store}
          trail={trail}
          mode={section}
          headings={headings}
          help={help}
          message={message}
          copy={copy}
        />
      </div>
    </Keymap>
  );
}

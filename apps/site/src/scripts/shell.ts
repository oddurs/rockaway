/**
 * The shell, live (cairn 0104). The server rendered the system's Panes,
 * StatusBar and link trees at a guessed size; this lays them out at the
 * window's real size with the system's own DOM halves, binds the keys with
 * the system's keymap engine, and follows the scroll. No React: everything
 * here is `@rockaway/react`'s pure and DOM halves, so the page's whole script
 * is a few kilobytes and every page works without it.
 *
 * What it reads from the page it reads from `src/lib/shell.ts`, the same shape
 * the server rendered from.
 */
import { screenAnsi, screenText } from '@rockaway/react/copy';
import { cellsIn, fitStatusBar, measureCell, relayoutPanes } from '@rockaway/react/dom';
import { keyShortcut } from '@rockaway/react/key-hint';
import { attachKeymap, detectPlatform, KeymapEngine } from '@rockaway/react/keymap';
import { type Glyphs, themeGlyphs } from '@rockaway/tokens';
import {
  attributesOf,
  DENSITIES,
  type Look,
  MODES,
  next,
  readLook,
  STORAGE_KEY,
  THEMES,
} from '../lib/look.ts';
import {
  type Action,
  HELP_BINDINGS,
  type ShellBinding,
  STACK_BELOW,
  STATUS_SEGMENTS,
  shellSplit,
} from '../lib/shell.ts';

/** The reader's stored look, if the browser keeps one. */
function stored(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** The built theme stylesheets, by theme, as the head's script left them. */
function themeUrls(): Readonly<Record<string, string>> {
  return (globalThis as { rockawayThemes?: Record<string, string> }).rockawayThemes ?? {};
}

/** How long a message stays on the message line, as StatusMessage keeps it. */
const MESSAGE_FOR = 4000;

const shell = document.querySelector<HTMLElement>('.site-shell');
const panes = shell?.querySelector<HTMLElement>(':scope > .rk-panes');
const bar = shell?.querySelector<HTMLElement>(':scope > .rk-statusbar');
const main = document.querySelector<HTMLElement>('main#content');
const map = document.querySelector<HTMLElement>('[data-site-map]');
const outline = document.querySelector<HTMLElement>('[data-site-outline]');
const page = document.querySelector<HTMLElement>('[data-site-page]');
const help = document.querySelector<HTMLElement>('[data-site-help]');

if (shell && panes && bar && main && page && help) {
  const title = shell.dataset.siteTitle ?? '';
  const sections = [...(outline?.querySelectorAll<HTMLAnchorElement>('a[href^="#"]') ?? [])];
  const segments = [
    ...bar.querySelectorAll<HTMLElement>('.rk-status-segment:not([role="status"])'),
  ];
  const content = (name: (typeof STATUS_SEGMENTS)[number]['name']): HTMLElement | null => {
    const at = STATUS_SEGMENTS.findIndex((s) => s.name === name);
    return segments[at]?.querySelector<HTMLElement>('.rk-status-content') ?? null;
  };
  const message = bar.querySelector<HTMLElement>('[role="status"] .rk-status-content');
  const mode = content('mode');
  const where = content('where');
  const position = content('position');
  const keys = content('keys');
  const trail = where?.textContent ?? '';
  const section = mode?.textContent ?? '';

  let stacked = false;
  let helping = false;
  let look: Look = readLook(stored());
  /** The theme's glyphs: its border set draws the panes, its marks cut the bar. */
  const glyphs = (): Glyphs =>
    (themeGlyphs as Readonly<Record<string, Glyphs>>)[look.theme] ?? themeGlyphs.default;

  /** Lay the panes and the bar out at the window's size, in whole cells. */
  const layout = (): void => {
    const cols = cellsIn(shell.getBoundingClientRect().width, measureCell(shell).width);
    stacked = cols < STACK_BELOW;
    relayoutPanes(
      panes,
      shellSplit({ stacked, title: helping ? 'keys' : title, outline: sections.length > 0 }),
      {},
      glyphs(),
    );
    fitStatusBar(bar, STATUS_SEGMENTS, glyphs());
    document.documentElement.dataset.rkShell = 'live';
  };

  /** Rewrite a segment's words, and fit the bar to them. */
  const write = (el: HTMLElement | null, text: string): void => {
    if (!el || el.textContent === text) return;
    el.textContent = text;
    fitStatusBar(bar, STATUS_SEGMENTS, glyphs());
  };

  let cleared = 0;
  /** Says something on the message line, for a few seconds. Read once by a screen reader. */
  const say = (text: string): void => {
    window.clearTimeout(cleared);
    write(message, text);
    cleared = window.setTimeout(() => write(message, ''), MESSAGE_FOR);
  };

  // ── Where you are ──────────────────────────────────────────────────────

  /** One row, in pixels, from the screen. */
  const row = (): number => {
    const height = Number.parseFloat(getComputedStyle(panes).getPropertyValue('--rk-cell-height'));
    return Number.isFinite(height) && height > 0 ? height : 24;
  };

  let current: string | undefined;
  let scrolled = false;
  const follow = (): void => {
    const { scrollTop, scrollHeight, clientHeight } = main;
    const room = scrollHeight - clientHeight;
    write(
      position,
      helping || room <= 1
        ? 'All'
        : scrollTop <= 0
          ? 'Top'
          : scrollTop >= room - 1
            ? 'Bot'
            : `${Math.round((scrollTop / room) * 100)}%`,
    );
    if (helping) return;
    // The section whose heading has passed the top of the pane, two rows in.
    const top = main.getBoundingClientRect().top + row() * 2;
    let at: HTMLAnchorElement | undefined;
    for (const link of sections) {
      const heading = document.getElementById(decodeURIComponent(link.hash.slice(1)));
      if (!heading || heading.getBoundingClientRect().top > top) break;
      at = link;
    }
    const id = at?.hash.slice(1);
    if (id === current) return;
    current = id;
    for (const link of sections) {
      if (link === at) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
    write(where, at ? `${trail} / ${at.textContent}` : trail);
    if (scrolled) {
      history.replaceState(
        history.state,
        '',
        `${location.pathname}${location.search}${at?.hash ?? ''}`,
      );
    }
  };

  let frame = 0;
  main.addEventListener(
    'scroll',
    () => {
      scrolled = true;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(follow);
    },
    { passive: true },
  );

  // ── Copying (0105) ─────────────────────────────────────────────────────

  /**
   * The screen a copy takes: the one you last pointed at or moved into (a
   * snapshot, an example), or the whole page. The status bar is where the
   * copy is pressed, so going there forgets nothing.
   */
  let pointed: HTMLElement | undefined;
  const follows = (event: Event): void => {
    const el = event.target instanceof Element ? event.target : null;
    if (el?.closest('.rk-statusbar')) return;
    // A click on the page focuses the page, after the pointer has already
    // said what was clicked: that focus says nothing new.
    if (event.type === 'focusin' && el?.getAttribute('tabindex') === '-1') return;
    // Nor does a click in an example that focuses the box it scrolls in.
    if (event.type === 'focusin' && pointed && el?.contains(pointed)) return;
    const SCREEN = 'figure[role="img"], .rk-screen';
    // Tabbing to the box an example scrolls in is moving into the example.
    const screen =
      el?.closest<HTMLElement>(SCREEN) ??
      (el?.matches('.rk-scroll-marks') ? el.querySelector<HTMLElement>(SCREEN) : null);
    // The shell's own screens are the page, which is what it copies anyway.
    pointed = screen && screen.parentElement !== shell ? screen : undefined;
  };
  document.addEventListener('focusin', follows);
  document.addEventListener('pointerdown', follows);

  /** What a screen is called in the message that says it was copied. */
  const nameOf = (screen: HTMLElement | undefined): string => {
    if (screen === undefined) return 'the page';
    const label = screen.getAttribute('aria-label');
    if (screen.matches('figure') && label) return `“${label.replace(/, as text$/, '')}”`;
    if (screen.closest('astro-island[component-export="Example"]')) return 'the example';
    return label ? `“${label}”` : 'the screen';
  };

  const copy = (as: 'text' | 'ANSI'): void => {
    const screen = pointed?.isConnected ? pointed : undefined;
    const from = screen ?? shell;
    const text = screenText(from);
    const lines = text.split('\n');
    const cols = Math.max(0, ...lines.map((line) => [...line].length));
    const what = `${nameOf(screen)} as ${as}, ${lines.length} rows of ${cols} cells`;
    if (!navigator.clipboard) {
      say(`Could not copy ${what}: this page cannot reach the clipboard.`);
      return;
    }
    navigator.clipboard.writeText(as === 'text' ? text : screenAnsi(from)).then(
      () => say(`Copied ${what}.${as === 'ANSI' ? ' Paste it into a terminal.' : ''}`),
      () => say(`Could not copy ${what}: the browser did not allow it.`),
    );
  };
  for (const button of bar.querySelectorAll<HTMLElement>('[data-site-copy]')) {
    const as = button.dataset.siteCopy === 'ANSI' ? 'ANSI' : 'text';
    button.addEventListener('click', () => copy(as));
    // Button announces its chord from an effect, which a server never runs:
    // say it here, as Button would, for the reader's keyboard.
    const shortcut = keyShortcut(as === 'ANSI' ? 'shift+y' : 'y', detectPlatform(navigator));
    if (shortcut) button.setAttribute('aria-keyshortcuts', shortcut);
  }

  // ── The look (0148) ────────────────────────────────────────────────────

  /** Show the look on its buttons, with what each is for a reader. */
  const label = (): void => {
    for (const button of bar.querySelectorAll<HTMLElement>('[data-site-look]')) {
      const part = button.dataset.siteLook as keyof Look;
      const value = button.querySelector<HTMLElement>('[data-site-look-value]');
      if (value) value.textContent = look[part];
      button.setAttribute('aria-label', `${part[0]?.toUpperCase()}${part.slice(1)}: ${look[part]}`);
    }
  };

  /** A theme's stylesheet, loaded once: the default theme is in the tokens already. */
  const sheet = (theme: string): Promise<void> => {
    const url = themeUrls()[theme];
    if (!url || document.querySelector(`link[data-rk-look="${theme}"]`)) return Promise.resolve();
    return new Promise((done) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.dataset.rkLook = theme;
      link.addEventListener('load', () => done(), { once: true });
      link.addEventListener('error', () => done(), { once: true });
      document.head.append(link);
    });
  };

  /** Apply a look: its stylesheet first, then the attributes, then the screen at the new cell. */
  let choosing = 0;
  const choose = async (chosen: Look, said: string): Promise<void> => {
    // The next key reads this look, even while its stylesheet is on its way.
    look = chosen;
    const turn = ++choosing;
    await sheet(chosen.theme);
    if (turn !== choosing) return;
    const root = document.documentElement;
    for (const [name, value] of Object.entries(attributesOf(look))) {
      if (value === undefined) root.removeAttribute(name);
      else root.setAttribute(name, value);
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(look));
    } catch {
      // A private window keeps nothing: the look holds for this page.
    }
    label();
    layout();
    follow();
    document.dispatchEvent(new CustomEvent('rk:look', { detail: look }));
    say(said);
  };

  const turn = {
    theme: (step: number) => {
      const theme = next(THEMES, look.theme, step);
      void choose({ ...look, theme }, `Theme: ${theme}.`);
    },
    mode: () => {
      const mode = next(MODES, look.mode);
      void choose({ ...look, mode }, `Mode: ${mode}.`);
    },
    density: () => {
      const density = next(DENSITIES, look.density);
      void choose({ ...look, density }, `Density: ${density}.`);
    },
  };
  for (const button of bar.querySelectorAll<HTMLElement>('[data-site-look]')) {
    const part = button.dataset.siteLook;
    button.addEventListener('click', () =>
      part === 'theme' ? turn.theme(1) : part === 'mode' ? turn.mode() : turn.density(),
    );
  }
  label();

  // ── The keys ───────────────────────────────────────────────────────────

  const by = (rows: number) => () => main.scrollBy({ top: rows * row() });
  const screenful = (): number => Math.max(1, Math.floor(main.clientHeight / row()) - 2);

  const showHelp = (open: boolean): void => {
    if (open === helping) return;
    helping = open;
    page.hidden = open;
    help.hidden = !open;
    for (const hint of keys?.querySelectorAll<HTMLElement>('[data-site-when]') ?? []) {
      hint.hidden = hint.dataset.siteWhen !== (open ? 'help' : 'page');
    }
    write(mode, open ? 'KEYS' : section);
    write(where, open ? 'The keys' : trail);
    current = undefined;
    main.scrollTop = 0;
    layout();
    follow();
    say(open ? 'The keys. Esc goes back to the page.' : 'Back to the page.');
    if (open) back = engine.register(scope, bindingFor(HELP_BINDINGS[0] as ShellBinding));
    else {
      back?.();
      back = undefined;
    }
  };

  const actions: Readonly<Record<Exclude<Action, `go:${string}`>, () => void>> = {
    down: by(1),
    up: by(-1),
    'page-down': () => by(screenful())(),
    'page-up': () => by(-screenful())(),
    top: () => main.scrollTo({ top: 0 }),
    bottom: () => main.scrollTo({ top: main.scrollHeight }),
    help: () => showHelp(!helping),
    back: () => showHelp(false),
    'copy-text': () => copy('text'),
    'copy-ansi': () => copy('ANSI'),
    theme: () => turn.theme(1),
    'theme-back': () => turn.theme(-1),
    mode: () => turn.mode(),
    density: () => turn.density(),
  };

  const bindingFor = (binding: ShellBinding) => ({
    keys: binding.keys,
    description: binding.description,
    action: binding.action.startsWith('go:')
      ? () => window.location.assign(binding.action.slice(3))
      : actions[binding.action as keyof typeof actions],
  });

  const engine = new KeymapEngine();
  const scope = engine.scope(undefined);
  engine.mount(scope);
  engine.setPlatform(detectPlatform(navigator));
  let back: (() => void) | undefined;
  const bound: readonly ShellBinding[] = JSON.parse(help.dataset.siteBindings ?? '[]');
  for (const binding of bound) engine.register(scope, bindingFor(binding));
  // Space and Enter on a button or a link are that control's: a server-rendered
  // control has no React Aria to claim them, so they are kept from the keymap
  // here, before it hears them, and the browser presses or follows as usual.
  document.addEventListener('keydown', (event) => {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    const at = event.target instanceof Element ? event.target : null;
    if (at?.closest('button, a[href], summary, [role="button"], input, select, textarea')) {
      event.stopImmediatePropagation();
    }
  });
  attachKeymap(engine, document);

  // A page's own script can say something on the message line too.
  document.addEventListener('rk:say', (event) => {
    if (event instanceof CustomEvent && typeof event.detail === 'string') say(event.detail);
  });

  // ── First frame ────────────────────────────────────────────────────────

  layout();
  if (typeof ResizeObserver !== 'undefined') {
    let pending = 0;
    new ResizeObserver(() => {
      cancelAnimationFrame(pending);
      pending = requestAnimationFrame(layout);
    }).observe(shell);
  }

  // The map opens at the page you are on, in the middle of its pane if it
  // has to scroll, and without scrolling anything outside the pane.
  const here = map
    ?.querySelector<HTMLElement>('[aria-current="page"]')
    ?.closest<HTMLElement>('.rk-link-tree-row');
  if (map && here) {
    const offset = here.getBoundingClientRect().top - map.getBoundingClientRect().top;
    map.scrollTop += offset - (map.clientHeight - here.getBoundingClientRect().height) / 2;
  }

  // A fragment in the address is a place in the page: go there now the panes
  // have their real size, which moved everything from where the server put it.
  const target = location.hash
    ? document.getElementById(decodeURIComponent(location.hash.slice(1)))
    : null;
  target?.scrollIntoView({ block: 'start' });
  follow();
}

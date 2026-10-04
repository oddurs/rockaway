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
import { cellsIn, fitStatusBar, measureCell, relayoutPanes } from '@rockaway/react/dom';
import { attachKeymap, detectPlatform, KeymapEngine } from '@rockaway/react/keymap';
import {
  type Action,
  HELP_BINDINGS,
  type ShellBinding,
  STACK_BELOW,
  STATUS_SEGMENTS,
  shellSplit,
} from '../lib/shell.ts';

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

  /** Lay the panes and the bar out at the window's size, in whole cells. */
  const layout = (): void => {
    const cols = cellsIn(shell.getBoundingClientRect().width, measureCell(shell).width);
    stacked = cols < STACK_BELOW;
    relayoutPanes(
      panes,
      shellSplit({ stacked, title: helping ? 'keys' : title, outline: sections.length > 0 }),
    );
    fitStatusBar(bar, STATUS_SEGMENTS);
    document.documentElement.dataset.rkShell = 'live';
  };

  /** Rewrite a segment's words, and fit the bar to them. */
  const write = (el: HTMLElement | null, text: string): void => {
    if (!el || el.textContent === text) return;
    el.textContent = text;
    fitStatusBar(bar, STATUS_SEGMENTS);
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

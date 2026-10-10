import { toText } from '@rockaway/grid';
import { glyphsFor } from '@rockaway/tokens';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { formatKeys, keyShortcut, parseKeys, spokenKeys } from '../src/components/key-hint.pure.ts';
import {
  type Binding,
  chordMatches,
  KeymapEngine,
  type KeyStroke,
  keymapHelpBuffer,
} from '../src/components/keymap.pure.ts';

/** A keystroke as the DOM would report it. */
function stroke(key: string, held: Partial<Omit<KeyStroke, 'key'>> = {}): KeyStroke {
  const code = key.length === 1 && /[a-z]/i.test(key) ? `Key${key.toUpperCase()}` : undefined;
  return {
    key,
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    metaKey: false,
    ...(code === undefined ? {} : { code }),
    ...held,
  };
}

/** An engine with a root scope, and a log of what fired. */
function setup(timeout?: number) {
  const fired: string[] = [];
  const conflicts: string[] = [];
  const engine = new KeymapEngine({
    ...(timeout === undefined ? {} : { timeout }),
    onConflict: (c) => conflicts.push(`${c.reason}: ${c.keys}`),
  });
  const root = engine.scope(undefined);
  engine.mount(root);
  const bind = (scope: typeof root, keys: string, description = keys): (() => void) =>
    engine.register(scope, { keys, description, action: () => fired.push(description) });
  return { engine, root, fired, conflicts, bind };
}

describe('chords', () => {
  test('a chord matches its keys, and only with exactly its modifiers', () => {
    const save = parseKeys('mod+s', 'other');
    expect(chordMatches(save, stroke('s', { ctrlKey: true }))).toBe(true);
    expect(chordMatches(save, stroke('s'))).toBe(false);
    expect(chordMatches(save, stroke('s', { ctrlKey: true, shiftKey: true }))).toBe(false);
    expect(chordMatches(parseKeys('mod+s', 'apple'), stroke('s', { metaKey: true }))).toBe(true);
  });

  test('a character is itself whatever shift typed it; a letter is not', () => {
    expect(chordMatches(parseKeys('?'), stroke('?', { shiftKey: true }))).toBe(true);
    expect(chordMatches(parseKeys('g'), stroke('G', { shiftKey: true }))).toBe(false);
    expect(chordMatches(parseKeys('shift+g'), stroke('G', { shiftKey: true }))).toBe(true);
  });

  test('named keys, and a letter typed with Alt on a Mac', () => {
    expect(chordMatches(parseKeys('esc'), stroke('Escape'))).toBe(true);
    expect(chordMatches(parseKeys('space'), stroke(' '))).toBe(true);
    expect(chordMatches(parseKeys('shift+up'), stroke('ArrowUp', { shiftKey: true }))).toBe(true);
    // Option+G types © on a Mac; the code still says G.
    expect(
      chordMatches(parseKeys('alt+g'), { ...stroke('©', { altKey: true }), code: 'KeyG' }),
    ).toBe(true);
  });
});

describe('the engine', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  test('a chord fires, and says it acted so the browser does not too', () => {
    const { engine, root, fired, bind } = setup();
    bind(root, 'mod+k', 'palette');
    expect(engine.handle(stroke('k', { ctrlKey: true }), false)).toBe(true);
    expect(engine.handle(stroke('j'), false)).toBe(false);
    expect(fired).toEqual(['palette']);
  });

  test('a two-key sequence fires on its second key, and times out after a second', () => {
    const { engine, root, fired, bind } = setup();
    bind(root, 'g h', 'home');
    bind(root, 'g i', 'issues');
    engine.handle(stroke('g'), false);
    expect(fired).toEqual([]);
    engine.handle(stroke('i'), false);
    expect(fired).toEqual(['issues']);

    engine.handle(stroke('g'), false);
    vi.advanceTimersByTime(1001);
    // Too late: `h` is only `h` now, which nothing is bound to.
    expect(engine.handle(stroke('h'), false)).toBe(false);
    expect(fired).toEqual(['issues']);
  });

  test('a key a sequence did not want is a key in its own right', () => {
    const { engine, root, fired, bind } = setup();
    bind(root, 'g h', 'home');
    bind(root, 'j', 'down');
    engine.handle(stroke('g'), false);
    engine.handle(stroke('j'), false);
    expect(fired).toEqual(['down']);
  });

  test('typing in a field types: a plain key does nothing there, a chord still fires', () => {
    const { engine, root, fired, bind } = setup();
    bind(root, 'g h', 'home');
    bind(root, '?', 'help');
    bind(root, 'mod+k', 'palette');
    expect(engine.handle(stroke('g'), true)).toBe(false);
    expect(engine.handle(stroke('h'), true)).toBe(false);
    expect(engine.handle(stroke('?', { shiftKey: true }), true)).toBe(false);
    expect(engine.handle(stroke('k', { ctrlKey: true }), true)).toBe(true);
    expect(fired).toEqual(['palette']);
  });

  test('the innermost scope wins; leaving it gives the keys back', () => {
    const { engine, root, fired, bind } = setup();
    bind(root, 'j', 'page down');
    bind(root, 'mod+k', 'palette');
    const pane = engine.scope(root);
    const unmount = engine.mount(pane);
    const unbind = bind(pane, 'j', 'pane down');
    engine.handle(stroke('j'), false);
    // The page's other bindings still answer inside a scope that is not modal.
    engine.handle(stroke('k', { ctrlKey: true }), false);
    unbind();
    unmount();
    engine.handle(stroke('j'), false);
    expect(fired).toEqual(['pane down', 'palette', 'page down']);
  });

  test('a modal scope hides every binding outside it while it is mounted', () => {
    const { engine, root, fired, bind } = setup();
    bind(root, 'j', 'page down');
    bind(root, 'mod+k', 'palette');
    const dialog = engine.scope(root, true);
    const close = engine.mount(dialog);
    bind(dialog, 'esc', 'close');
    expect(engine.handle(stroke('j'), false)).toBe(false);
    expect(engine.handle(stroke('k', { ctrlKey: true }), false)).toBe(false);
    engine.handle(stroke('Escape'), false);
    expect(engine.active().map((b) => b.description)).toEqual(['close']);
    close();
    engine.handle(stroke('j'), false);
    expect(fired).toEqual(['close', 'page down']);
  });

  test('active bindings: shadowed keys once, outer scopes first, and one spelling per chord', () => {
    const { engine, root, bind } = setup();
    bind(root, 'mod+k', 'palette');
    bind(root, 'j', 'page down');
    bind(root, '?', 'help');
    const pane = engine.scope(root);
    engine.mount(pane);
    bind(pane, 'j', 'pane down');
    bind(pane, 'g h', 'home');
    expect(engine.active().map((b) => `${b.canonical} ${b.description}`)).toEqual([
      'ctrl+k palette',
      '? help',
      'j pane down',
      'g h home',
    ]);
    // The same array until something changes, as useSyncExternalStore needs.
    expect(engine.active()).toBe(engine.active());
  });

  test('a duplicate in one scope, and a chord that starts a sequence, are conflicts, reported once', () => {
    const { root, conflicts, bind } = setup();
    bind(root, 'cmd+k', 'palette');
    bind(root, 'meta+k', 'search');
    bind(root, 'g', 'go');
    bind(root, 'g h', 'home');
    bind(root, 'x', 'unrelated');
    expect(conflicts).toEqual(['duplicate: meta+k', 'prefix: g h']);
  });

  test('a binding with no action presses its target', () => {
    const { engine, root } = setup();
    const click = vi.fn();
    const target = { current: { click } as unknown as HTMLElement };
    const binding: Binding = { keys: 'mod+s', description: 'save', target };
    engine.register(root, binding);
    engine.handle(stroke('s', { ctrlKey: true }), false);
    expect(click).toHaveBeenCalledOnce();
  });
});

describe('sequences in KeyHint', () => {
  test('drawn a cell apart, spoken with "then", and never an aria-keyshortcuts value', () => {
    expect(formatKeys('g h')).toBe('g h');
    expect(formatKeys('mod+k g', 'apple')).toBe('⌘K g');
    expect(spokenKeys('g h')).toBe('G then H');
    expect(keyShortcut('g h')).toBeUndefined();
    expect(keyShortcut('mod+k', 'apple')).toBe('Meta+K');
  });
});

describe('keymapHelpBuffer', () => {
  const BINDINGS = [
    { keys: 'mod+k', description: 'Open the palette' },
    { keys: '?', description: 'Show this help' },
    { keys: 'g h', description: 'Go home' },
    { keys: 'j', description: 'Next row' },
    { keys: 'shift+up', description: 'Select upwards' },
  ];

  test('the keys in a column as wide as the widest, then what they do', () => {
    expect(
      [
        toText(keymapHelpBuffer(BINDINGS, 'other')),
        '',
        toText(keymapHelpBuffer(BINDINGS, 'apple')),
        '',
        toText(keymapHelpBuffer(BINDINGS, 'apple', glyphsFor({ borderSet: 'ascii' }))),
      ].join('\n'),
    ).toMatchInlineSnapshot(`
      "Ctrl+K   Open the palette
      ?        Show this help
      g h      Go home
      j        Next row
      Shift+↑  Select upwards

      ⌘K   Open the palette
      ?    Show this help
      g h  Go home
      j    Next row
      ⇧↑   Select upwards

      Cmd+K     Open the palette
      ?         Show this help
      g h       Go home
      j         Next row
      Shift+Up  Select upwards"
    `);
  });
});

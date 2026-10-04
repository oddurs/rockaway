/**
 * The keymap engine with no React (cairn 0237).
 *
 * A page with no React (the site's plain TypeScript shell) imports the engine
 * from `@rockaway/react/keymap` and has to load no React to do it. Here React
 * and React Aria throw the moment anything imports them, and the engine's own
 * module graph is loaded and driven end to end: scopes, bindings, a chord, a
 * sequence, a modal scope, the document listener and the keyboard.
 */
import { afterEach, describe, expect, test, vi } from 'vitest';

const loaded: string[] = [];
for (const name of ['react', 'react-dom', 'react/jsx-runtime', 'react-aria-components']) {
  vi.doMock(name, () => {
    loaded.push(name);
    throw new Error(`${name} was imported`);
  });
}

const pure = await import('../src/components/keymap.pure.ts');
// The keyboard comes from the same module as the engine, as the entry has it.
const platform = pure;
const keys = await import('../src/components/key-hint.pure.ts');

type Listener = (event: KeyboardEvent) => void;

/** A document as far as `attachKeymap` sees one: something that dispatches keydown. */
function fakeDocument() {
  const listeners = new Set<Listener>();
  return {
    addEventListener: (_type: 'keydown', listener: Listener) => listeners.add(listener),
    removeEventListener: (_type: 'keydown', listener: Listener) => listeners.delete(listener),
    listening: () => listeners.size,
    /** Press a key, with focus on `target`; true when something prevented its default. */
    press(key: string, held: Partial<KeyboardEvent> = {}, target: unknown = null): boolean {
      let prevented = false;
      const event = {
        key,
        code: /^[a-z]$/i.test(key) ? `Key${key.toUpperCase()}` : '',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        metaKey: false,
        isComposing: false,
        defaultPrevented: false,
        target,
        preventDefault: () => {
          prevented = true;
        },
        ...held,
      } as unknown as KeyboardEvent;
      for (const listener of listeners) listener(event);
      return prevented;
    },
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('without React', () => {
  test('the engine, the listener, the keys and the keyboard load, and nothing loads React', () => {
    expect(typeof pure.KeymapEngine).toBe('function');
    expect(typeof pure.attachKeymap).toBe('function');
    expect(typeof pure.chordMatches).toBe('function');
    expect(typeof pure.isEditable).toBe('function');
    expect(typeof platform.detectPlatform).toBe('function');
    expect(typeof keys.keyShortcut).toBe('function');
    expect(loaded).toEqual([]);
  });

  test('scopes, a chord, a sequence and a modal scope, through a document listener', () => {
    vi.useFakeTimers();
    const fired: string[] = [];
    const engine = new pure.KeymapEngine();
    engine.setPlatform(platform.detectPlatform({ userAgent: 'Mozilla/5.0 (Macintosh)' }));
    const root = engine.scope(undefined);
    engine.mount(root);
    const bind = (scope: typeof root, spec: string) =>
      engine.register(scope, { keys: spec, description: spec, action: () => fired.push(spec) });
    bind(root, 'mod+k');
    bind(root, 'g h');
    bind(root, '?');

    const doc = fakeDocument();
    const detach = pure.attachKeymap(engine, doc);

    // mod is Command on the keyboard detected.
    expect(doc.press('k', { metaKey: true })).toBe(true);
    expect(doc.press('k', { ctrlKey: true })).toBe(false);
    // A sequence: the first key waits, the second fires.
    expect(doc.press('g')).toBe(true);
    expect(doc.press('h')).toBe(true);
    // A plain key in a text field is typing; a chord there still fires.
    const field = { tagName: 'INPUT', type: 'text', isContentEditable: false };
    expect(doc.press('?', {}, field)).toBe(false);
    expect(doc.press('k', { metaKey: true }, field)).toBe(true);
    // A key a component handled never reaches the page.
    expect(doc.press('?', { defaultPrevented: true })).toBe(false);
    expect(fired).toEqual(['mod+k', 'g h', 'mod+k']);

    // A modal scope hides the page's bindings while it is mounted.
    const dialog = engine.scope(root, true);
    const unmount = engine.mount(dialog);
    const off = bind(dialog, 'esc');
    expect(doc.press('?')).toBe(false);
    expect(doc.press('Escape')).toBe(true);
    off();
    unmount();
    expect(doc.press('?')).toBe(true);
    expect(fired).toEqual(['mod+k', 'g h', 'mod+k', 'esc', '?']);

    // What a help screen lists: each binding's keys, its words and one spelling.
    expect(engine.active().map((b) => [b.keys, b.description, b.canonical])).toEqual([
      ['mod+k', 'mod+k', 'meta+k'],
      ['g h', 'g h', 'g h'],
      ['?', '?', '?'],
    ]);

    // Detached: no listener left, and a half-typed sequence forgotten.
    doc.press('g');
    detach();
    expect(doc.listening()).toBe(0);
    engine.register(root, { keys: 'h', description: 'h', action: () => fired.push('h') });
    expect(
      engine.handle(
        { key: 'h', ctrlKey: false, altKey: false, shiftKey: false, metaKey: false },
        false,
      ),
    ).toBe(true);
    expect(fired.at(-1)).toBe('h');
  });

  test('a binding with no action presses its target, which needs only a current', () => {
    const engine = new pure.KeymapEngine();
    const root = engine.scope(undefined);
    engine.mount(root);
    let pressed = 0;
    const button = { click: () => (pressed += 1) } as unknown as HTMLElement;
    engine.register(root, { keys: 'mod+s', description: 'Save', target: { current: button } });
    const doc = fakeDocument();
    pure.attachKeymap(engine, doc);
    expect(doc.press('s', { ctrlKey: true })).toBe(true);
    expect(pressed).toBe(1);
    // And what the page tells a reader, set by the page itself without React.
    expect(keys.keyShortcut('mod+s', 'other')?.toLowerCase()).toBe('control+s');
  });

  test('what is typing: fields that take text, and nothing else', () => {
    const el = (tagName: string, extra: Record<string, unknown> = {}): EventTarget =>
      ({ tagName, isContentEditable: false, ...extra }) as unknown as EventTarget;
    expect(pure.isEditable(el('INPUT'))).toBe(true);
    expect(pure.isEditable(el('input', { type: 'search' }))).toBe(true);
    expect(pure.isEditable(el('TEXTAREA'))).toBe(true);
    expect(pure.isEditable(el('SELECT'))).toBe(true);
    expect(pure.isEditable(el('DIV', { isContentEditable: true }))).toBe(true);
    expect(pure.isEditable(el('INPUT', { type: 'checkbox' }))).toBe(false);
    expect(pure.isEditable(el('BUTTON'))).toBe(false);
    expect(pure.isEditable(null)).toBe(false);
  });

  test('the keyboard, from what a browser says about itself', () => {
    expect(platform.detectPlatform({ userAgentData: { platform: 'macOS' } })).toBe('apple');
    expect(platform.detectPlatform({ userAgent: 'Mozilla/5.0 (Windows NT 10.0)' })).toBe('other');
    expect(platform.detectPlatform(undefined)).toBe('other');
  });
});

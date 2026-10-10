/**
 * `Keymap`: the pure half (cairn 0141, 0126, 0237).
 *
 * The engine, which knows scopes, bindings and what a keystroke does; the
 * listener that feeds it a document's keys; and the help screen as cells. No
 * React and no client boundary, so a server component, a static renderer, a
 * test, or a page with no React at all can use them. Only `attachKeymap` and
 * `isEditable` touch the DOM, and only when they are called. `keymap.tsx`
 * wires the engine to React and imports all of it from here.
 */
import { Buffer, drawText, stringWidth } from '@rockaway/grid';
import { type Glyphs, themeGlyphs } from '@rockaway/tokens';
import type { Platform } from '../platform.pure.ts';

// The keyboard the engine is told about, so a page with no React detects it
// the way `usePlatform` does, from the same entry as the engine.
export { detectPlatform, type Platform, type PlatformHints } from '../platform.pure.ts';

import { formatKeys, type KeySpec, parseKeys, stepsOf } from './key-hint.pure.ts';

/** One shortcut: its keys, what it does, and what it says it does. */
export interface Binding {
  /** A KeyHint spec: `mod+k`, `?`, `esc`, or a sequence of chords, `g h`. */
  readonly keys: string;
  /** What it does, in a few words, for `KeymapHelp`. */
  readonly description: string;
  /**
   * What happens. Given no action, a binding with a `target` presses it, so
   * a shortcut for a button is the button's own press.
   */
  readonly action?: (event: KeyboardEvent) => void;
  /**
   * The element the shortcut belongs to: a React ref, or anything with a
   * `current`. `useKeymap` puts `aria-keyshortcuts` on it while the binding
   * is registered, so a reader is told the shortcut where it applies. A
   * sequence has no `aria-keyshortcuts` form, and sets none.
   */
  readonly target?: { readonly current: HTMLElement | null };
}

/** What the engine needs from a key event: the DOM's, or a test's. */
export interface KeyStroke {
  readonly key: string;
  readonly code?: string;
  readonly ctrlKey: boolean;
  readonly altKey: boolean;
  readonly shiftKey: boolean;
  readonly metaKey: boolean;
}

/** A conflict: two bindings that cannot both have their keys. */
export interface KeymapConflict {
  readonly keys: string;
  readonly descriptions: readonly string[];
  readonly reason: 'duplicate' | 'prefix';
}

/** A scope of bindings: the page's, a pane's, a dialog's. */
export interface KeymapScope {
  readonly parent: KeymapScope | undefined;
  readonly modal: boolean;
}

/** A binding the keymap will act on, as `KeymapHelp` and the handler see it. */
export interface ActiveBinding {
  readonly keys: string;
  readonly description: string;
  /** The keys in one spelling, for comparing. */
  readonly canonical: string;
}

export interface KeymapEngineOptions {
  /** How long the second key of a sequence may take. A second unless told otherwise. */
  readonly timeout?: number;
  /** Told of every conflict, once each. */
  readonly onConflict?: (conflict: KeymapConflict) => void;
}

/** How long the second key of a sequence may take, in milliseconds. */
const SEQUENCE_TIMEOUT = 1000;

/** Keys that are only modifiers: holding one is not a keystroke of its own. */
const MODIFIER_KEYS = new Set(['Shift', 'Control', 'Alt', 'Meta', 'AltGraph', 'CapsLock']);

/** The DOM's names for the named keys, as a spec writes them. */
const NAMED: Readonly<Record<string, string>> = {
  Enter: 'enter',
  Escape: 'esc',
  Tab: 'tab',
  ' ': 'space',
  Backspace: 'backspace',
  Delete: 'delete',
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  PageUp: 'pageup',
  PageDown: 'pagedown',
  Home: 'home',
  End: 'end',
};

const isLetter = (key: string): boolean => key.length === 1 && key >= 'a' && key <= 'z';

/**
 * Whether a keystroke is this chord. Control, Alt and Command have to agree
 * exactly. Shift has to agree for a letter or a named key; for any other
 * character it is how the character is typed, so `?` is `?` whatever shift
 * says. With Alt held a Mac types `©` for `g`, so a letter is also matched by
 * the key's code.
 */
export function chordMatches(chord: KeySpec, stroke: KeyStroke): boolean {
  if (chord.ctrl !== stroke.ctrlKey || chord.alt !== stroke.altKey) return false;
  if (chord.meta !== stroke.metaKey) return false;
  const named = NAMED[stroke.key];
  if (named !== undefined) return named === chord.key && chord.shift === stroke.shiftKey;
  if (isLetter(chord.key)) {
    if (chord.shift !== stroke.shiftKey) return false;
    return (
      stroke.key.toLowerCase() === chord.key || stroke.code === `Key${chord.key.toUpperCase()}`
    );
  }
  return stroke.key === chord.key;
}

/** A plain chord: no Control, Alt or Command. Typing it into a field types it. */
const isPlain = (chord: KeySpec): boolean => !chord.ctrl && !chord.alt && !chord.meta;

/** A spec in one spelling, so `cmd+k` and `meta+k` are the same keys. */
function canonical(keys: string, platform: Platform): string {
  return stepsOf(keys)
    .map((step) => {
      const chord = parseKeys(step, platform);
      return [
        chord.ctrl ? 'ctrl' : '',
        chord.alt ? 'alt' : '',
        chord.shift ? 'shift' : '',
        chord.meta ? 'meta' : '',
        chord.key,
      ]
        .filter((part) => part !== '')
        .join('+');
    })
    .join(' ');
}

interface Registered {
  readonly binding: Binding;
  readonly scope: KeymapScope;
  readonly order: number;
}

function depthOf(scope: KeymapScope): number {
  let depth = 0;
  for (let s = scope.parent; s; s = s.parent) depth += 1;
  return depth;
}

function within(scope: KeymapScope, ancestor: KeymapScope): boolean {
  for (let s: KeymapScope | undefined = scope; s; s = s.parent) if (s === ancestor) return true;
  return false;
}

/**
 * The keymap itself, with no DOM and no React: scopes, bindings, and what a
 * keystroke does. `Keymap` makes one at the root of a page and feeds it the
 * document's keystrokes.
 */
export class KeymapEngine {
  private readonly bindings = new Set<Registered>();
  private readonly mounted = new Map<KeymapScope, number>();
  private readonly listeners = new Set<() => void>();
  private readonly reported = new Set<string>();
  private order = 0;
  private platform: Platform = 'other';
  private pending:
    | { readonly candidates: readonly Registered[]; readonly step: number }
    | undefined;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private cache: readonly ActiveBinding[] | undefined;
  private readonly timeout: number;
  private readonly onConflict: ((conflict: KeymapConflict) => void) | undefined;

  constructor(options: KeymapEngineOptions = {}) {
    this.timeout = options.timeout ?? SEQUENCE_TIMEOUT;
    this.onConflict = options.onConflict;
  }

  /** A scope inside `parent`, or the root when there is none. Not active until mounted. */
  scope(parent: KeymapScope | undefined, modal = false): KeymapScope {
    return { parent, modal };
  }

  /** The scope is on the page: a modal one now hides everything outside it. */
  mount(scope: KeymapScope): () => void {
    this.mounted.set(scope, this.order++);
    this.changed();
    return () => {
      this.mounted.delete(scope);
      this.changed();
    };
  }

  /** Adds a binding to a scope; the function returned takes it away. */
  register(scope: KeymapScope, binding: Binding): () => void {
    const entry: Registered = { binding, scope, order: this.order++ };
    this.bindings.add(entry);
    this.changed();
    this.check();
    return () => {
      this.bindings.delete(entry);
      this.changed();
    };
  }

  /** Which keyboard `mod` means. */
  setPlatform(platform: Platform): void {
    if (platform === this.platform) return;
    this.platform = platform;
    this.changed();
  }

  /** Tells `listener` whenever the active bindings may have changed. */
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  /**
   * Every binding that would act now, the innermost first among any that
   * share keys and the rest dropped, in the order they were bound, outer
   * scopes before inner. The same array until something changes.
   */
  active = (): readonly ActiveBinding[] => {
    if (this.cache) return this.cache;
    const seen = new Set<string>();
    const out: { active: ActiveBinding; depth: number; order: number }[] = [];
    for (const entry of this.prioritised()) {
      const keys = canonical(entry.binding.keys, this.platform);
      if (seen.has(keys)) continue;
      seen.add(keys);
      out.push({
        active: {
          keys: entry.binding.keys,
          description: entry.binding.description,
          canonical: keys,
        },
        depth: depthOf(entry.scope),
        order: entry.order,
      });
    }
    out.sort((a, b) => a.depth - b.depth || a.order - b.order);
    this.cache = out.map((o) => o.active);
    return this.cache;
  };

  /** Every conflict among the bindings, whether reported yet or not. */
  conflicts(): KeymapConflict[] {
    const out: KeymapConflict[] = [];
    const byScope = new Map<KeymapScope, Registered[]>();
    for (const entry of this.bindings) {
      byScope.set(entry.scope, [...(byScope.get(entry.scope) ?? []), entry]);
    }
    for (const entries of byScope.values()) {
      const byKeys = new Map<string, Registered[]>();
      for (const entry of entries) {
        const keys = canonical(entry.binding.keys, this.platform);
        byKeys.set(keys, [...(byKeys.get(keys) ?? []), entry]);
      }
      for (const [keys, same] of byKeys) {
        if (same.length > 1) {
          out.push({
            keys,
            descriptions: same.map((e) => e.binding.description),
            reason: 'duplicate',
          });
        }
      }
    }
    // A chord that is also the first key of a sequence: the sequence could
    // never be typed, because the chord fires first.
    const all = this.active();
    for (const chord of all) {
      if (chord.canonical.includes(' ')) continue;
      for (const sequence of all) {
        if (sequence.canonical.startsWith(`${chord.canonical} `)) {
          out.push({
            keys: sequence.canonical,
            descriptions: [chord.description, sequence.description],
            reason: 'prefix',
          });
        }
      }
    }
    return out;
  }

  /**
   * What a keystroke does. `editable` says focus is in a field that takes
   * text, where a plain key is typing. True when the keymap acted, and the
   * caller should prevent the browser's own handling.
   */
  handle(stroke: KeyStroke, editable: boolean): boolean {
    if (MODIFIER_KEYS.has(stroke.key)) return false;
    const pending = this.pending;
    if (pending) {
      this.clear();
      const next = pending.step;
      const matched = pending.candidates.filter((entry) => {
        const chord = this.steps(entry)[next];
        return chord !== undefined && chordMatches(chord, stroke);
      });
      if (matched.length > 0) return this.advance(matched, next + 1, stroke);
      // Not the key a sequence wanted: the sequence is over, and the key is
      // a key in its own right.
    }
    const started = this.prioritised().filter((entry) => {
      const first = this.steps(entry)[0];
      if (first === undefined || !chordMatches(first, stroke)) return false;
      return !(editable && isPlain(first));
    });
    if (started.length === 0) return false;
    return this.advance(started, 1, stroke);
  }

  /** Forgets a sequence half typed. */
  reset(): void {
    this.clear();
  }

  private advance(matched: readonly Registered[], step: number, stroke: KeyStroke): boolean {
    // The highest priority binding that this key completes acts now.
    const done = matched.find((entry) => this.steps(entry).length === step);
    if (done) {
      this.fire(done, stroke);
      return true;
    }
    this.pending = { candidates: matched, step };
    this.timer = setTimeout(() => this.clear(), this.timeout);
    return true;
  }

  private fire(entry: Registered, stroke: KeyStroke): void {
    const { action, target } = entry.binding;
    if (action) action(stroke as KeyboardEvent);
    else target?.current?.click();
  }

  private clear(): void {
    if (this.timer !== undefined) clearTimeout(this.timer);
    this.timer = undefined;
    this.pending = undefined;
  }

  private steps(entry: Registered): KeySpec[] {
    return stepsOf(entry.binding.keys).map((step) => parseKeys(step, this.platform));
  }

  /** The scopes that are live: everything, or only the topmost modal scope and what is in it. */
  private live(scope: KeymapScope): boolean {
    let top: KeymapScope | undefined;
    let topRank: [number, number] = [-1, -1];
    for (const [s, order] of this.mounted) {
      if (!s.modal) continue;
      const rank: [number, number] = [depthOf(s), order];
      if (rank[0] > topRank[0] || (rank[0] === topRank[0] && rank[1] > topRank[1])) {
        top = s;
        topRank = rank;
      }
    }
    return top === undefined || within(scope, top);
  }

  /** Live bindings, innermost scope first, then the most recently bound. */
  private prioritised(): Registered[] {
    return [...this.bindings]
      .filter((entry) => this.live(entry.scope))
      .sort((a, b) => depthOf(b.scope) - depthOf(a.scope) || b.order - a.order);
  }

  private changed(): void {
    this.cache = undefined;
    this.clear();
    for (const listener of this.listeners) listener();
  }

  private check(): void {
    if (!this.onConflict) return;
    for (const conflict of this.conflicts()) {
      const key = `${conflict.reason} ${conflict.keys} ${conflict.descriptions.join('|')}`;
      if (this.reported.has(key)) continue;
      this.reported.add(key);
      this.onConflict(conflict);
    }
  }
}

/** Input types whose keys are not typing: a plain key there is still a shortcut. */
const NOT_TYPING = new Set([
  'checkbox',
  'radio',
  'button',
  'submit',
  'reset',
  'range',
  'color',
  'file',
  'image',
]);

/**
 * Whether focus is somewhere a plain key is typing: a field that takes text.
 * Read by tag and property rather than by `instanceof`, so an element from
 * another frame answers the same, and so is a test's stand-in.
 */
export function isEditable(target: EventTarget | null): boolean {
  if (target === null || typeof target !== 'object' || !('tagName' in target)) return false;
  const element = target as HTMLElement & { readonly type?: string };
  if (element.isContentEditable) return true;
  const tag = String(element.tagName).toUpperCase();
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (tag !== 'INPUT') return false;
  return !NOT_TYPING.has(String(element.type ?? 'text').toLowerCase());
}

/** What a focused control does with Space or Enter, as the browser does it. */
const ACTIVATABLE = 'button, a[href], summary, [role="button"], input, select, textarea';

/**
 * Whether a keystroke is the focused control's own: Space or Enter with no
 * Control, Alt or Command, on (or inside) a button, a link, a summary, a
 * `role="button"` or a form field. The browser presses or follows the control
 * with it, and does so even when no script has claimed the key, as on a page
 * rendered on the server and never hydrated. A keymap that took the key there
 * would prevent the press. With a modifier it is a chord, and the page's.
 */
export function isControlKey(stroke: KeyStroke, target: EventTarget | null): boolean {
  if (stroke.key !== ' ' && stroke.key !== 'Enter') return false;
  if (stroke.ctrlKey || stroke.altKey || stroke.metaKey) return false;
  if (target === null || typeof target !== 'object') return false;
  const closest = (target as { closest?: (selector: string) => unknown }).closest;
  return typeof closest === 'function' && closest.call(target, ACTIVATABLE) != null;
}

/** What `attachKeymap` listens on: a document, or any target of key events. */
export interface KeyEventSource {
  addEventListener(type: 'keydown', listener: (event: KeyboardEvent) => void): void;
  removeEventListener(type: 'keydown', listener: (event: KeyboardEvent) => void): void;
}

/**
 * Feeds a document's keys to an engine: the page-level listener, which
 * `Keymap` uses and a page without React can call. A key a component has
 * already handled (its default prevented) or one that is composing text never
 * reaches it; a plain key in a field that takes text is typing; Space or Enter
 * on a focused control is the control's, scripted or not (`isControlKey`); a
 * key the keymap acts on has its default prevented. The function returned stops
 * listening and forgets a sequence half typed.
 */
export function attachKeymap(engine: KeymapEngine, source: KeyEventSource): () => void {
  const listen = (event: KeyboardEvent): void => {
    // A component that handled the key has said so; the page does not get it too.
    if (event.defaultPrevented || event.isComposing) return;
    if (isControlKey(event, event.target)) return;
    if (engine.handle(event, isEditable(event.target))) event.preventDefault();
  };
  source.addEventListener('keydown', listen);
  return () => {
    source.removeEventListener('keydown', listen);
    engine.reset();
  };
}

/** Cells between the keys and what they do. */
const GAP = 2;

/**
 * The help screen as cells: every binding's keys in a column as wide as the
 * widest, two cells of air, and what it does. Its text snapshot; the
 * component writes the same columns.
 */
export function keymapHelpBuffer(
  bindings: readonly Pick<Binding, 'keys' | 'description'>[],
  platform: Platform = 'other',
  glyphs: Glyphs = themeGlyphs.default,
): Buffer {
  const faces = bindings.map((b) => formatKeys(b.keys, platform, 'platform', glyphs));
  const column = Math.max(0, ...faces.map((face) => stringWidth(face)));
  const width = Math.max(0, ...bindings.map((b) => column + GAP + stringWidth(b.description)));
  return Buffer.create({ width, height: bindings.length }).draw((draft) => {
    bindings.forEach((binding, y) => {
      drawText(draft, { x: 0, y }, faces[y] ?? '', {
        style: { fg: 'fg.accent', attrs: 0 },
      });
      drawText(draft, { x: column + GAP, y }, binding.description);
    });
  });
}

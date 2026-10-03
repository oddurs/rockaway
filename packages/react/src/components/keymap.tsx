'use client';

/**
 * The keymap (cairn 0141): the page's shortcuts, in one place.
 *
 * React Aria handles the keys inside a component: the arrows in a list, Space
 * on a switch. A page also has keys of its own, `⌘K` for the palette from
 * anywhere, `g h` to go home, `?` for help, and nothing in the behaviour
 * layer listened for those. Rule 4 forbids each component hand-rolling a
 * listener, so this is the one page-level key handler, written once:
 *
 *   - a binding is a KeyHint spec (0099): a chord, `mod+k`, or a sequence of
 *     two, `g h`, whose second key has to come within a second of the first
 *   - a plain key (no Control, Alt or Command) is ignored while focus is in a
 *     field that takes text, so typing `g` in a text field types `g`; a
 *     chord with a modifier fires anywhere
 *   - scopes nest and the innermost wins, so a dialog's `j` shadows the
 *     page's; a `modal` scope hides everything outside it while it is mounted
 *   - a key a component has already handled (its default prevented, or its
 *     propagation stopped) never reaches the keymap
 *   - two bindings for the same keys in one scope are a conflict, reported
 *     once, and so is a chord that is also the start of a sequence
 *   - a binding with a `target` puts `aria-keyshortcuts` on it, so the
 *     shortcut is announced on the thing it presses
 *
 * `KeymapHelp` lists every binding that is active where it is rendered, as
 * KeyHints and their descriptions, so the `?` screen is generated from the
 * bindings and can never disagree with them.
 *
 * The engine underneath is plain TypeScript with no DOM in it, tested in
 * Node; the components wire it to the document and to React.
 */
import {
  createContext,
  type ReactNode,
  type RefObject,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { cx } from '../cx.ts';
import { type Platform, usePlatform } from '../platform.ts';
import { keyShortcut } from './key-hint.pure.ts';
import { KeyHint } from './key-hint.tsx';
import { KeymapEngine } from './keymap.pure.ts';

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
   * The element the shortcut belongs to. It takes `aria-keyshortcuts` while
   * the binding is registered, so a reader is told the shortcut where it
   * applies. A sequence has no `aria-keyshortcuts` form, and sets none.
   */
  readonly target?: RefObject<HTMLElement | null>;
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

/** Whether focus is somewhere a plain key is typing: a field that takes text. */
function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return true;
  if (!(target instanceof HTMLInputElement)) return false;
  return ![
    'checkbox',
    'radio',
    'button',
    'submit',
    'reset',
    'range',
    'color',
    'file',
    'image',
  ].includes(target.type);
}

interface Context {
  readonly engine: KeymapEngine;
  readonly scope: KeymapScope;
}

const KeymapContext = createContext<Context | null>(null);

/** Says what a conflict is, out loud, where a developer will see it. */
function warn(conflict: KeymapConflict): void {
  const what =
    conflict.reason === 'duplicate'
      ? `is bound twice in one scope (${conflict.descriptions.join(', ')}); the later wins`
      : `can never be typed: "${conflict.descriptions[0]}" fires on its first key`;
  console.warn(`rockaway keymap: "${conflict.keys}" ${what}.`);
}

export interface KeymapProps {
  /**
   * A scope that hides every binding outside it while it is mounted: a
   * dialog's, so the page behind it does not answer the keys.
   */
  readonly modal?: boolean;
  /** At the root: how long the second key of a sequence may take, in milliseconds. */
  readonly timeout?: number;
  /** At the root: told of each conflict once. A console warning unless given. */
  readonly onConflict?: (conflict: KeymapConflict) => void;
  readonly children?: ReactNode;
}

/**
 * A scope of shortcuts. The outermost is the page's keymap: it listens to the
 * document, once, for the whole page. One inside another is a scope of its
 * own, whose bindings shadow the same keys outside it; `modal` hides the rest
 * of the page's while it is mounted. Bindings come from `useKeymap` anywhere
 * inside.
 */
export function Keymap({ modal = false, timeout, onConflict, children }: KeymapProps): ReactNode {
  const outer = useContext(KeymapContext);
  const [context] = useState<Context>(() => {
    const engine =
      outer?.engine ??
      new KeymapEngine({
        ...(timeout === undefined ? {} : { timeout }),
        onConflict: onConflict ?? warn,
      });
    return { engine, scope: engine.scope(outer?.scope, modal) };
  });
  const { engine, scope } = context;
  const root = outer === null;
  const platform = usePlatform();

  useEffect(() => engine.mount(scope), [engine, scope]);

  useEffect(() => {
    if (root) engine.setPlatform(platform);
  }, [engine, root, platform]);

  useEffect(() => {
    if (!root) return;
    const listen = (event: KeyboardEvent): void => {
      // A component that handled the key has said so; the page does not get it too.
      if (event.defaultPrevented || event.isComposing) return;
      if (engine.handle(event, isEditable(event.target))) event.preventDefault();
    };
    document.addEventListener('keydown', listen);
    return () => {
      document.removeEventListener('keydown', listen);
      engine.reset();
    };
  }, [engine, root]);

  return <KeymapContext.Provider value={context}>{children}</KeymapContext.Provider>;
}

export interface UseKeymapOptions {
  /** Bound while true. A pane can keep its shortcuts and turn them off. */
  readonly enabled?: boolean;
}

/**
 * Binds shortcuts in the nearest `Keymap`, for as long as the component is
 * mounted. The bindings may be a new array every render: they are bound again
 * only when their keys or descriptions change, and an action is always the
 * latest one given.
 */
export function useKeymap(bindings: readonly Binding[], options: UseKeymapOptions = {}): void {
  const context = useContext(KeymapContext);
  if (context === null) throw new Error('useKeymap needs a <Keymap> around it.');
  const { engine, scope } = context;
  const enabled = options.enabled ?? true;
  const platform = usePlatform();
  const latest = useRef(bindings);
  latest.current = bindings;
  const signature = bindings.map((b) => `${b.keys}\u0000${b.description}`).join('\u0001');

  // biome-ignore lint/correctness/useExhaustiveDependencies: bound again when the signature changes, and actions read the latest bindings
  useEffect(() => {
    if (!enabled) return;
    const undo = latest.current.map((binding, i) =>
      engine.register(scope, {
        keys: binding.keys,
        description: binding.description,
        ...(binding.target === undefined ? {} : { target: binding.target }),
        ...(binding.action === undefined
          ? {}
          : { action: (event: KeyboardEvent) => latest.current[i]?.action?.(event) }),
      }),
    );
    return () => {
      for (const off of undo) off();
    };
  }, [engine, scope, enabled, signature]);

  // The shortcut is announced on the element it belongs to.
  // biome-ignore lint/correctness/useExhaustiveDependencies: as above
  useEffect(() => {
    if (!enabled) return;
    const set: { el: HTMLElement; value: string }[] = [];
    for (const binding of latest.current) {
      const el = binding.target?.current;
      const value = keyShortcut(binding.keys, platform);
      if (!el || value === undefined) continue;
      el.setAttribute('aria-keyshortcuts', value);
      set.push({ el, value });
    }
    return () => {
      for (const { el, value } of set) {
        if (el.getAttribute('aria-keyshortcuts') === value) el.removeAttribute('aria-keyshortcuts');
      }
    };
  }, [enabled, signature, platform]);
}

/** The bindings active where it is called, updating as they change. */
export function useActiveBindings(): readonly ActiveBinding[] {
  const context = useContext(KeymapContext);
  if (context === null) throw new Error('useActiveBindings needs a <Keymap> around it.');
  const { engine } = context;
  return useSyncExternalStore(engine.subscribe, engine.active, () => EMPTY);
}

const EMPTY: readonly ActiveBinding[] = [];

export interface KeymapHelpProps {
  /** Which keyboard to draw the chords for. The reader's by default. */
  readonly platform?: Platform | 'auto';
  readonly className?: string;
}

/**
 * Every shortcut active where it is rendered, as KeyHints and what they do,
 * in two columns of cells. Bind `?` to show it, and the help screen is the
 * keymap itself, never a list written beside it.
 */
export function KeymapHelp({ platform = 'auto', className }: KeymapHelpProps): ReactNode {
  const bindings = useActiveBindings();
  const keyboard = usePlatform(platform);
  return (
    <dl className={cx('rk-keymap-help', className)}>
      {bindings.map((binding) => (
        <div key={binding.canonical} className="rk-keymap-help-row">
          <dt className="rk-keymap-help-keys">
            <KeyHint keys={binding.keys} platform={keyboard} />
          </dt>
          <dd className="rk-keymap-help-description">{binding.description}</dd>
        </div>
      ))}
    </dl>
  );
}

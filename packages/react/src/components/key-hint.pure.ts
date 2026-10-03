/**
 * `KeyHint`: the pure half (cairn 0126).
 *
 * A chord, parsed, and the three strings it becomes: what you see, what a reader hears, and what the platform is told. No React and no client boundary, so a server component, a static
 * renderer or a test can call it; `key-hint.tsx` imports it from here.
 */
import type { KeyNotation, KeySpec, Platform } from './key-hint.tsx';

type Modifier = 'ctrl' | 'alt' | 'shift' | 'meta';

const MODIFIERS: Readonly<Record<string, Modifier>> = {
  ctrl: 'ctrl',
  control: 'ctrl',
  alt: 'alt',
  opt: 'alt',
  option: 'alt',
  shift: 'shift',
  meta: 'meta',
  cmd: 'meta',
  command: 'meta',
  super: 'meta',
};

/** Named keys, and what each keyboard calls them. */
const NAMED: Readonly<Record<string, { apple: string; other: string; spoken: string }>> = {
  enter: { apple: '↵', other: 'Enter', spoken: 'Enter' },
  esc: { apple: 'Esc', other: 'Esc', spoken: 'Escape' },
  tab: { apple: '⇥', other: 'Tab', spoken: 'Tab' },
  space: { apple: '␣', other: 'Space', spoken: 'Space' },
  backspace: { apple: '⌫', other: 'Bksp', spoken: 'Backspace' },
  delete: { apple: '⌦', other: 'Del', spoken: 'Delete' },
  up: { apple: '↑', other: '↑', spoken: 'Up arrow' },
  down: { apple: '↓', other: '↓', spoken: 'Down arrow' },
  left: { apple: '←', other: '←', spoken: 'Left arrow' },
  right: { apple: '→', other: '→', spoken: 'Right arrow' },
  pageup: { apple: '⇞', other: 'PgUp', spoken: 'Page up' },
  pagedown: { apple: '⇟', other: 'PgDn', spoken: 'Page down' },
  home: { apple: '↖', other: 'Home', spoken: 'Home' },
  end: { apple: '↘', other: 'End', spoken: 'End' },
};

const APPLE_GLYPHS = { ctrl: '⌃', alt: '⌥', shift: '⇧', meta: '⌘' } as const;
const WORDS = { ctrl: 'Ctrl', alt: 'Alt', shift: 'Shift', meta: 'Meta' } as const;
const SPOKEN = { ctrl: 'Control', alt: 'Alt', shift: 'Shift', meta: 'Command' } as const;

/** `mod+shift+k` → the spec. `mod` is Command on an Apple keyboard, Control elsewhere. */
export function parseKeys(spec: string, platform: Platform = 'other'): KeySpec {
  const out = { ctrl: false, alt: false, shift: false, meta: false, key: '' };
  for (const part of spec.toLowerCase().split('+')) {
    const name = part.trim();
    if (name === '') continue;
    if (name === 'mod') {
      if (platform === 'apple') out.meta = true;
      else out.ctrl = true;
      continue;
    }
    const modifier = MODIFIERS[name];
    if (modifier) out[modifier] = true;
    else out.key = name;
  }
  return out;
}

function held<T extends string>(keys: KeySpec, table: Readonly<Record<Modifier, T>>): T[] {
  // Always in this order, whatever order the spec was written in: a chord
  // should read the same everywhere it appears.
  const order: Modifier[] = ['ctrl', 'alt', 'shift', 'meta'];
  return order.filter((modifier) => keys[modifier]).map((modifier) => table[modifier]);
}

function keyFace(key: string, platform: Platform): string {
  const named = NAMED[key];
  if (named) return platform === 'apple' ? named.apple : named.other;
  return key.length === 1 ? key.toUpperCase() : key;
}

/** What you see. */
export function formatKeys(
  spec: string,
  platform: Platform = 'other',
  notation: KeyNotation = 'platform',
): string {
  const keys = parseKeys(spec, platform);
  const face = keyFace(keys.key, platform);

  if (notation === 'terminal') {
    // The notation a terminal has always used: ^ for control, M- for meta.
    // A capital letter carries shift, because `^K` and `^⇧K` are the same chord
    // to a terminal — but a named key has no capital, so `shift+up` has to say
    // so or it reads as plain `up`.
    // A single letter has a capital to carry it; `up` and `enter` do not.
    const carried = keys.key.length === 1 && keys.key >= 'a' && keys.key <= 'z';
    const shift = keys.shift && !carried ? '⇧' : '';
    const prefix = `${keys.ctrl ? '^' : ''}${keys.alt || keys.meta ? 'M-' : ''}${shift}`;
    return `${prefix}${face}`;
  }

  // An Apple keyboard stacks its glyphs; everywhere else the chord is spelled
  // out with separators, because `CtrlShiftK` is not a word either.
  return platform === 'apple'
    ? `${held(keys, APPLE_GLYPHS).join('')}${face}`
    : [...held(keys, WORDS), face].join('+');
}

/** What a reader hears. `⌘` is not a word. */
export function spokenKeys(spec: string, platform: Platform = 'other'): string {
  const keys = parseKeys(spec, platform);
  const named = NAMED[keys.key];
  const face = named ? named.spoken : keys.key.toUpperCase();
  return [...held(keys, SPOKEN), face].join(' ');
}

/** What the platform is told: the value for `aria-keyshortcuts`. */
export function keyShortcut(spec: string, platform: Platform = 'other'): string {
  const keys = parseKeys(spec, platform);
  const names = { ctrl: 'Control', alt: 'Alt', shift: 'Shift', meta: 'Meta' } as const;
  return [...held(keys, names), keys.key].join('+');
}

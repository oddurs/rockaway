/**
 * `KeyHint`: the pure half (cairn 0126).
 *
 * A chord, parsed, and the three strings it becomes: what you see, what a
 * reader hears, and what the platform is told. No React and no client boundary,
 * so a server component, a static renderer or a test can call it; `key-
 * hint.tsx` imports it from here.
 */
import { stringWidth } from '@rockaway/grid';
import type { Glyphs, KeyName } from '@rockaway/tokens';
import { themeGlyphs } from '@rockaway/tokens';
import type { Platform } from '../platform.ts';
import type { KeyNotation, KeySpec } from './key-hint.tsx';

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

/**
 * Named keys: the legend a keycap prints, from the theme (cairn 0132); the
 * word for a keyboard that prints words; what a reader hears; and its name in
 * `aria-keyshortcuts`, which is the UI Events `key` value, except the space
 * bar, which ARIA names `Space`. Arrows are symbols on every keyboard, so
 * they take their legend on both.
 */
const NAMED: Readonly<
  Record<
    string,
    { legend?: KeyName; word: string; spoken: string; aria: string; everywhere?: boolean }
  >
> = {
  enter: { legend: 'enter', word: 'Enter', spoken: 'Enter', aria: 'Enter' },
  esc: { word: 'Esc', spoken: 'Escape', aria: 'Escape' },
  tab: { legend: 'tab', word: 'Tab', spoken: 'Tab', aria: 'Tab' },
  space: { legend: 'space', word: 'Space', spoken: 'Space', aria: 'Space' },
  backspace: { legend: 'backspace', word: 'Bksp', spoken: 'Backspace', aria: 'Backspace' },
  delete: { legend: 'delete', word: 'Del', spoken: 'Delete', aria: 'Delete' },
  up: { legend: 'up', word: 'Up', spoken: 'Up arrow', aria: 'ArrowUp', everywhere: true },
  down: { legend: 'down', word: 'Down', spoken: 'Down arrow', aria: 'ArrowDown', everywhere: true },
  left: { legend: 'left', word: 'Left', spoken: 'Left arrow', aria: 'ArrowLeft', everywhere: true },
  right: {
    legend: 'right',
    word: 'Right',
    spoken: 'Right arrow',
    aria: 'ArrowRight',
    everywhere: true,
  },
  pageup: { legend: 'pageup', word: 'PgUp', spoken: 'Page up', aria: 'PageUp' },
  pagedown: { legend: 'pagedown', word: 'PgDn', spoken: 'Page down', aria: 'PageDown' },
  home: { legend: 'home', word: 'Home', spoken: 'Home', aria: 'Home' },
  end: { legend: 'end', word: 'End', spoken: 'End', aria: 'End' },
};

const WORDS = { ctrl: 'Ctrl', alt: 'Alt', shift: 'Shift', meta: 'Meta' } as const;
/**
 * What a reader hears for each modifier, by the keyboard it is on: the word
 * printed on the key. An Apple keyboard says Command and Option; anyone
 * else's says Alt, and the meta key is Meta, whatever its cap shows (a
 * Windows logo, a Super, a diamond), which is also what `aria-keyshortcuts`
 * calls it (cairn 0189).
 */
const SPOKEN = {
  apple: { ctrl: 'Control', alt: 'Option', shift: 'Shift', meta: 'Command' },
  other: { ctrl: 'Control', alt: 'Alt', shift: 'Shift', meta: 'Meta' },
} as const satisfies Record<Platform, Record<Modifier, string>>;

/**
 * The chords of a sequence, in order: `g h` is two, `mod+k` one. Chords are
 * written with `+` and separated by spaces (cairn 0141).
 */
export function stepsOf(spec: string): string[] {
  return spec
    .trim()
    .split(/\s+/)
    .filter((step) => step !== '');
}

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

function keyFace(key: string, platform: Platform, glyphs: Glyphs): string {
  const named = NAMED[key];
  if (named === undefined) return key.length === 1 ? key.toUpperCase() : key;
  const legend = named.legend === undefined ? undefined : glyphs.key[named.legend];
  return legend !== undefined && (platform === 'apple' || named.everywhere) ? legend : named.word;
}

/**
 * What you see. The legends are the theme's: symbols in Unicode, words in an
 * ASCII theme, where `⌘⇧K` becomes `Cmd+Shift+K`.
 */
export function formatKeys(
  spec: string,
  platform: Platform = 'other',
  notation: KeyNotation = 'platform',
  glyphs: Glyphs = themeGlyphs.default,
): string {
  // A sequence, `g h`, is its chords one after another, a cell apart.
  const steps = stepsOf(spec);
  if (steps.length > 1) {
    return steps.map((step) => formatKeys(step, platform, notation, glyphs)).join(' ');
  }
  const keys = parseKeys(spec, platform);
  // A letter on its own is what you type, so it shows as you type it: `y`,
  // and `g h`. With a modifier it is a keycap, which prints a capital: `⌘K`,
  // `Ctrl+K`, `⇧Y`. A bare capital would read as Shift held, which it is not.
  const letter = keys.key.length === 1 && keys.key >= 'a' && keys.key <= 'z';
  const bare = !keys.ctrl && !keys.alt && !keys.shift && !keys.meta;
  const face = letter && bare ? keys.key : keyFace(keys.key, platform, glyphs);

  if (notation === 'terminal') {
    // The notation a terminal has always used: ^ for control, M- for meta.
    // A capital letter carries shift, because `^K` and `^⇧K` are the same chord
    // to a terminal, and alone a capital is shift: `Y` is `shift+y`, and `y`
    // is `y`. A named key has no capital, so `shift+up` has to say so or it
    // reads as plain `up`.
    const carried = letter;
    // Shift is the theme's symbol where it is one cell, and emacs's `S-` where
    // the theme spells it out.
    const symbol = glyphs.key.shift;
    const shiftMark = stringWidth(symbol) === 1 ? symbol : 'S-';
    const shift = keys.shift && !carried ? shiftMark : '';
    const prefix = `${keys.ctrl ? '^' : ''}${keys.alt || keys.meta ? 'M-' : ''}${shift}`;
    return `${prefix}${face}`;
  }

  // An Apple keyboard stacks its symbols; everywhere else the chord is spelled
  // out with separators, because `CtrlShiftK` is not a word either. So is an
  // Apple chord in a theme whose legends are words: `CmdShiftK` is no better.
  if (platform !== 'apple') return [...held(keys, WORDS), face].join('+');
  const legends = held(keys, glyphs.key);
  const stacked = legends.every((legend) => stringWidth(legend) === 1);
  return stacked ? `${legends.join('')}${face}` : [...legends, face].join('+');
}

/** What a reader hears. `⌘` is not a word. A sequence is its chords, "then" between them. */
export function spokenKeys(spec: string, platform: Platform = 'other'): string {
  const steps = stepsOf(spec);
  if (steps.length > 1) return steps.map((step) => spokenKeys(step, platform)).join(' then ');
  const keys = parseKeys(spec, platform);
  const named = NAMED[keys.key];
  const face = named ? named.spoken : keys.key.toUpperCase();
  return [...held(keys, SPOKEN[platform]), face].join(' ');
}

/**
 * A key's name in `aria-keyshortcuts` (WAI-ARIA 1.2): a printable character
 * as it is printed, so a letter is its capital, as every example in the spec
 * writes it; a function key as `F1`; any other named key as its UI Events
 * `key` value, `Escape` or `ArrowUp`.
 */
function ariaKey(key: string): string {
  const named = NAMED[key];
  if (named !== undefined) return named.aria;
  if (/^f\d{1,2}$/.test(key)) return key.toUpperCase();
  return key.length === 1 ? key.toUpperCase() : key;
}

/**
 * What the platform is told: the value for `aria-keyshortcuts`. One chord:
 * the attribute has no way to say "this, then that", and a space in its value
 * means "or", so a sequence has no value here and gives `undefined`.
 *
 * The modifiers are the UI Events names, first, in one order; the key is
 * last, as `ariaKey` names it. ARIA counts `a` and `A` as the same key, so a
 * capital says nothing more about Shift: `shift+y` is `Shift+Y`, and `y`
 * alone is `Y`.
 */
export function keyShortcut(spec: string, platform: Platform = 'other'): string | undefined {
  if (stepsOf(spec).length > 1) return undefined;
  const keys = parseKeys(spec, platform);
  const names = { ctrl: 'Control', alt: 'Alt', shift: 'Shift', meta: 'Meta' } as const;
  return [...held(keys, names), ariaKey(keys.key)].join('+');
}

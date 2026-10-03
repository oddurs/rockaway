'use client';

/**
 * `KeyHint` (cairn 0099): `⌘S save` — how a TUI teaches itself.
 *
 * Three strings come out of one spec, and all three are needed:
 *
 *   - what you see: `⌘S` on an Apple keyboard, `Ctrl+S` elsewhere, `^S` in
 *     terminal notation
 *   - what a reader hears: "Command S" on an Apple keyboard, "Control S"
 *     elsewhere, because `⌘` is not a word
 *   - what the platform is told: `Meta+s`, for `aria-keyshortcuts`
 *
 * The glyphs are `aria-hidden` and the spoken form sits beside them, so a hint
 * reads properly on its own and never leaks into the accessible name of the
 * control it labels. A hint inside a button is `decorative`, and the button
 * carries `aria-keyshortcuts` instead — the attribute made for exactly this.
 *
 * The legends are the theme's (cairn 0132): symbols in Unicode, words in an
 * ASCII theme. The keyboard is `usePlatform()`'s, the same hook Button asks,
 * so a chord is never drawn for one keyboard and announced for another.
 */
import { stringWidth } from '@rockaway/grid';
import type { Glyphs, KeyName } from '@rockaway/tokens';
import type { ReactNode } from 'react';
import { VisuallyHidden } from 'react-aria-components';
import { cx } from '../cx.ts';
import { defaultGlyphs, useGlyphs } from '../glyphs.tsx';
import { type Platform, usePlatform } from '../platform.ts';

export type { Platform } from '../platform.ts';
export type KeyNotation = 'platform' | 'terminal';

export interface KeySpec {
  readonly ctrl: boolean;
  readonly alt: boolean;
  readonly shift: boolean;
  readonly meta: boolean;
  readonly key: string;
}

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
 * word for a keyboard that prints words; and what a reader hears. Arrows are
 * symbols on every keyboard, so they take their legend on both.
 */
const NAMED: Readonly<
  Record<string, { legend?: KeyName; word: string; spoken: string; everywhere?: boolean }>
> = {
  enter: { legend: 'enter', word: 'Enter', spoken: 'Enter' },
  esc: { word: 'Esc', spoken: 'Escape' },
  tab: { legend: 'tab', word: 'Tab', spoken: 'Tab' },
  space: { legend: 'space', word: 'Space', spoken: 'Space' },
  backspace: { legend: 'backspace', word: 'Bksp', spoken: 'Backspace' },
  delete: { legend: 'delete', word: 'Del', spoken: 'Delete' },
  up: { legend: 'up', word: 'Up', spoken: 'Up arrow', everywhere: true },
  down: { legend: 'down', word: 'Down', spoken: 'Down arrow', everywhere: true },
  left: { legend: 'left', word: 'Left', spoken: 'Left arrow', everywhere: true },
  right: { legend: 'right', word: 'Right', spoken: 'Right arrow', everywhere: true },
  pageup: { legend: 'pageup', word: 'PgUp', spoken: 'Page up' },
  pagedown: { legend: 'pagedown', word: 'PgDn', spoken: 'Page down' },
  home: { legend: 'home', word: 'Home', spoken: 'Home' },
  end: { legend: 'end', word: 'End', spoken: 'End' },
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
  glyphs: Glyphs = defaultGlyphs,
): string {
  const keys = parseKeys(spec, platform);
  const face = keyFace(keys.key, platform, glyphs);

  if (notation === 'terminal') {
    // The notation a terminal has always used: ^ for control, M- for meta.
    // A capital letter carries shift, because `^K` and `^⇧K` are the same chord
    // to a terminal — but a named key has no capital, so `shift+up` has to say
    // so or it reads as plain `up`.
    // A single letter has a capital to carry it; `up` and `enter` do not.
    const carried = keys.key.length === 1 && keys.key >= 'a' && keys.key <= 'z';
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

/** What a reader hears. `⌘` is not a word. */
export function spokenKeys(spec: string, platform: Platform = 'other'): string {
  const keys = parseKeys(spec, platform);
  const named = NAMED[keys.key];
  const face = named ? named.spoken : keys.key.toUpperCase();
  return [...held(keys, SPOKEN[platform]), face].join(' ');
}

/** What the platform is told: the value for `aria-keyshortcuts`. */
export function keyShortcut(spec: string, platform: Platform = 'other'): string {
  const keys = parseKeys(spec, platform);
  const names = { ctrl: 'Control', alt: 'Alt', shift: 'Shift', meta: 'Meta' } as const;
  return [...held(keys, names), keys.key].join('+');
}

export interface KeyHintProps {
  /** `mod+s`, `ctrl+shift+k`, `esc`. `mod` follows the keyboard. */
  readonly keys: string;
  /** Which keyboard to render for. The reader's by default, through `usePlatform()`. */
  readonly platform?: Platform | 'auto';
  readonly notation?: KeyNotation;
  /**
   * Inside a control, where the hint must not join the accessible name: the
   * whole thing goes `aria-hidden`, and the control takes `aria-keyshortcuts`.
   */
  readonly decorative?: boolean;
  /** The action the chord performs: `⌘S save`. */
  readonly children?: ReactNode;
  readonly className?: string;
}

export function KeyHint({
  keys,
  platform = 'auto',
  notation = 'platform',
  decorative = false,
  children,
  className,
}: KeyHintProps): ReactNode {
  // The server renders the neutral keyboard and hydration agrees with it;
  // usePlatform() swaps in the reader's on the render after (cairn 0132).
  const resolved = usePlatform(platform);
  const glyphs = useGlyphs();

  return (
    <span className={cx('rk-keyhint', className)} {...(decorative ? { 'aria-hidden': true } : {})}>
      <kbd className="rk-keyhint-keys">
        <span aria-hidden="true">{formatKeys(keys, resolved, notation, glyphs)}</span>
        {decorative ? null : <VisuallyHidden>{spokenKeys(keys, resolved)}</VisuallyHidden>}
      </kbd>
      {children === undefined ? null : <span className="rk-keyhint-label">{children}</span>}
    </span>
  );
}

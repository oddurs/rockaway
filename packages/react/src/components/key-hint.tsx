/**
 * `KeyHint` (cairn 0099): `⌘S save` — how a TUI teaches itself.
 *
 * Three strings come out of one spec, and all three are needed:
 *
 *   - what you see: `⌘S` on an Apple keyboard, `Ctrl+S` elsewhere, `^S` in
 *     terminal notation
 *   - what a reader hears: "Command S", because `⌘` is not a word
 *   - what the platform is told: `Meta+s`, for `aria-keyshortcuts`
 *
 * The glyphs are `aria-hidden` and the spoken form sits beside them, so a hint
 * reads properly on its own and never leaks into the accessible name of the
 * control it labels. A hint inside a button is `decorative`, and the button
 * carries `aria-keyshortcuts` instead — the attribute made for exactly this.
 */
import { type ReactNode, useEffect, useState } from 'react';
import { VisuallyHidden } from 'react-aria-components';
import { cx } from '../cx.ts';

export type Platform = 'apple' | 'other';
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

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'other';
  const value = `${navigator.platform ?? ''} ${navigator.userAgent ?? ''}`;
  return /mac|iphone|ipad|ipod/i.test(value) ? 'apple' : 'other';
}

export interface KeyHintProps {
  /** `mod+s`, `ctrl+shift+k`, `esc`. `mod` follows the keyboard. */
  readonly keys: string;
  /** Which keyboard to render for. Detected after mount by default. */
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
  // The server cannot know the keyboard, so it renders the neutral form and the
  // first client render matches it. Detection lands in an effect, after
  // hydration has agreed with the server.
  const [detected, setDetected] = useState<Platform>('other');
  useEffect(() => {
    if (platform === 'auto') setDetected(detectPlatform());
  }, [platform]);
  const resolved = platform === 'auto' ? detected : platform;

  return (
    <span className={cx('rk-keyhint', className)} {...(decorative ? { 'aria-hidden': true } : {})}>
      <kbd className="rk-keyhint-keys">
        <span aria-hidden="true">{formatKeys(keys, resolved, notation)}</span>
        {decorative ? null : <VisuallyHidden>{spokenKeys(keys, resolved)}</VisuallyHidden>}
      </kbd>
      {children === undefined ? null : <span className="rk-keyhint-label">{children}</span>}
    </span>
  );
}

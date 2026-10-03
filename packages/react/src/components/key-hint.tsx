'use client';

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
import { formatKeys, spokenKeys } from './key-hint.pure.ts';

export type Platform = 'apple' | 'other';
export type KeyNotation = 'platform' | 'terminal';

export interface KeySpec {
  readonly ctrl: boolean;
  readonly alt: boolean;
  readonly shift: boolean;
  readonly meta: boolean;
  readonly key: string;
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

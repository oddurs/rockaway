'use client';

import type { ReactNode } from 'react';
import { VisuallyHidden } from 'react-aria-components';
import { cx } from '../cx.ts';
import { useGlyphs } from '../glyphs.tsx';
import { type Platform, usePlatform } from '../platform.ts';
import { formatKeys, spokenKeys } from './key-hint.pure.ts';

export type { Platform } from '../platform.ts';
export type KeyNotation = 'platform' | 'terminal';

export interface KeySpec {
  readonly ctrl: boolean;
  readonly alt: boolean;
  readonly shift: boolean;
  readonly meta: boolean;
  readonly key: string;
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

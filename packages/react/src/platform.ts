'use client';

/**
 * Which keyboard the reader has (cairn 0132): Apple's, or anyone else's.
 *
 * It decides what a chord looks like (`⌘S` or `Ctrl+S`), what it is called
 * ("Command S"), and what `aria-keyshortcuts` says, so every component that
 * shows a chord has to agree on it. A button that draws `⌘S` and announces
 * `Control+S` is wrong twice. One hook answers the question for all of them.
 *
 * The server cannot know the keyboard, so it renders `other`. The hook is an
 * external store whose server snapshot is `other`, which React uses for the
 * render that hydrates and then replaces with the client's answer: the markup
 * matches, and the keyboard is right from the next render. A page rendered
 * only on the client is right from the first.
 */
import { useSyncExternalStore } from 'react';

export type Platform = 'apple' | 'other';

/** What a browser can tell us about itself. `userAgentData` is the modern way, where it exists. */
export interface PlatformHints {
  readonly userAgentData?: { readonly platform?: string } | undefined;
  readonly userAgent?: string | undefined;
}

const APPLE = /mac|iphone|ipad|ipod|ios/i;

/**
 * The keyboard a browser's hints describe. `userAgentData.platform` first,
 * because `navigator.platform` is deprecated and frozen in some browsers;
 * the user agent string where client hints are not offered (Safari, Firefox).
 */
export function detectPlatform(hints: PlatformHints | undefined): Platform {
  if (hints === undefined) return 'other';
  const platform = hints.userAgentData?.platform;
  if (platform !== undefined && platform !== '') return APPLE.test(platform) ? 'apple' : 'other';
  return APPLE.test(hints.userAgent ?? '') ? 'apple' : 'other';
}

/** The keyboard does not change under a page, so there is nothing to subscribe to. */
const subscribe = (): (() => void) => () => {};
const onClient = (): Platform =>
  detectPlatform(typeof navigator === 'undefined' ? undefined : (navigator as PlatformHints));
const onServer = (): Platform => 'other';

/**
 * The keyboard to draw chords for. Given a platform, that one; given `auto`
 * (the default), the reader's, without a hydration mismatch.
 */
export function usePlatform(platform: Platform | 'auto' = 'auto'): Platform {
  const detected = useSyncExternalStore(subscribe, onClient, onServer);
  return platform === 'auto' ? detected : platform;
}

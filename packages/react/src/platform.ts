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
import { detectPlatform, type Platform, type PlatformHints } from './platform.pure.ts';

export { detectPlatform, type Platform, type PlatformHints } from './platform.pure.ts';

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

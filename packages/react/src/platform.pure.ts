/**
 * Which keyboard the reader has (cairn 0132): the pure half (cairn 0237).
 *
 * The detection itself, with no React, so a page with no React can ask the
 * same question `usePlatform` does and get the same answer. `platform.ts`
 * holds the hook and imports this.
 */

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

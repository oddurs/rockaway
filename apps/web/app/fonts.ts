/**
 * The site's faces (cairn 0295), through `next/font/local`: IBM Plex Mono's
 * regular, bold and true italic, and the symbols it lacks. Next hashes and
 * self-hosts each file and preloads the three Plex faces; `lib/font.ts` puts
 * them at the head of the stack, before fallbacks of the same width.
 *
 * Next's own fallback is off: it would be Arial, scaled. The site's fallbacks
 * are system monospace fonts scaled to Plex's cell, which is what a grid
 * needs from one.
 */
import localFont from 'next/font/local';

export const siteMono = localFont({
  src: [
    { path: './fonts/plex-mono-regular.woff2', weight: '400', style: 'normal' },
    { path: './fonts/plex-mono-bold.woff2', weight: '700', style: 'normal' },
    { path: './fonts/plex-mono-italic.woff2', weight: '400', style: 'italic' },
  ],
  display: 'swap',
  preload: true,
  adjustFontFallback: false,
});

/**
 * Plex's missing symbols, from JetBrains Mono: two kilobytes, fetched only by
 * a page that sets one of them.
 */
export const siteSymbols = localFont({
  src: [{ path: './fonts/plex-symbols.woff2', weight: '400 700', style: 'normal' }],
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
});

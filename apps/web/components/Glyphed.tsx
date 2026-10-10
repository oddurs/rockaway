'use client';

/**
 * The reader's theme's glyphs, for the system's components on a page (0119):
 * an example, a product shot. Loaded with them, never with the shell, whose
 * own chrome takes its glyphs from the stylesheet.
 *
 * The server draws in the site's theme, and so does hydration, so the two
 * agree; the reader's theme follows at once, and with every change of look.
 * A theme changes characters, never how many cells they take, so nothing
 * moves when it does.
 */
import { GlyphProvider } from '@rockaway/react';
import { type Glyphs, themeGlyphs } from '@rockaway/tokens';
import { type ReactNode, useEffect, useState } from 'react';
import { SITE_THEME } from '../lib/look.ts';

const all = themeGlyphs as Readonly<Record<string, Glyphs>>;

export function Glyphed({ children }: { readonly children: ReactNode }): ReactNode {
  const [theme, setTheme] = useState(SITE_THEME);
  useEffect(() => {
    const read = (): void => setTheme(document.documentElement.dataset.rkTheme ?? SITE_THEME);
    read();
    document.addEventListener('rk:look', read);
    return () => document.removeEventListener('rk:look', read);
  }, []);
  return <GlyphProvider glyphs={all[theme] ?? themeGlyphs.default}>{children}</GlyphProvider>;
}

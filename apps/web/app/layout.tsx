/**
 * The document every page is rendered into, and the app shell around them,
 * mounted once: a route change replaces only the page and its outline.
 *
 * The head's order matters on a grid: the pre-paint script first, so the
 * reader's theme, mode and density are on `<html>` before anything is drawn
 * (0148), then the font, preloaded, with fallbacks whose cell is the font's,
 * so nothing moves when it arrives.
 */
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { AppShell } from '../components/AppShell.tsx';
import { fontFaces } from '../lib/font.ts';
import { prePaint, SITE_THEME } from '../lib/look.ts';
import { asset } from '../lib/paths.ts';
import { shellBindings } from '../lib/shell.ts';
import { NAV, THEME_URLS } from '../lib/site.ts';

const font = asset('fonts/jetbrains-mono.woff2');

export const metadata: Metadata = {
  metadataBase: new URL('https://oddurs.github.io'),
  title: { default: 'rockaway', template: '%s — rockaway' },
  description:
    'A design system for terminal interfaces on the web: every box drawn on a grid of character cells, and every page still a web page.',
  icons: { icon: asset('favicon.svg') },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({
  children,
  outline,
}: {
  children: ReactNode;
  outline: ReactNode;
}): ReactNode {
  return (
    // The pre-paint script changes these attributes before React hydrates.
    <html lang="en" data-rk-theme={SITE_THEME} suppressHydrationWarning>
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: the site's own script, written at build. */}
        <script dangerouslySetInnerHTML={{ __html: prePaint(THEME_URLS) }} />
        <link rel="preload" href={font} as="font" type="font/woff2" crossOrigin="" />
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: the faces, with the font's URL from the build. */}
        <style dangerouslySetInnerHTML={{ __html: fontFaces(font) }} />
      </head>
      <body>
        <a className="site-skip" href="#content">
          Skip to the page
        </a>
        <AppShell nav={NAV} bindings={shellBindings(NAV)} outline={outline}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}

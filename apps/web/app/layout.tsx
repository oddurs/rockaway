/**
 * The document every page is rendered into, and the app shell around them,
 * mounted once: a route change replaces only the page and its outline.
 *
 * The shell is the server's (cairn 0104, 0309): one CSS grid of panes, each a
 * whole number of cells, laid out by the stylesheet from attributes the head's
 * script sets before the first frame. The panes' borders, the map and the
 * outline are markup. So the first frame is the shell at its real size, with
 * no script, and when the script arrives nothing moves: it adds behaviour,
 * never geometry.
 *
 * The head's order matters on a grid: the pre-paint script first, so the
 * reader's theme, mode, density and shell are on `<html>` before anything is
 * drawn (0148), then the font, preloaded by `next/font`, with fallbacks whose
 * cell is the font's, so nothing moves when it arrives.
 */
import { themeNames } from '@rockaway/tokens';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { PaneChrome } from '../components/shell/PaneChrome.tsx';
import { Shell } from '../components/shell/Shell.tsx';
import { SiteTree } from '../components/shell/SiteTree.tsx';
import { fontFaces } from '../lib/font.ts';
import { glyphSetCss } from '../lib/glyph-sets.ts';
import { prePaint, SITE_THEME, STORAGE_KEY } from '../lib/look.ts';
import { asset } from '../lib/paths.ts';
import { shellBindings } from '../lib/shell.ts';
import { NAV, THEME_URLS } from '../lib/site.ts';
import { siteMono, siteSymbols } from './fonts.ts';

export const metadata: Metadata = {
  metadataBase: new URL('https://oddurs.github.io'),
  title: { default: 'rockaway', template: '%s — rockaway' },
  description:
    'A design system for terminal interfaces on the web: every box drawn on a grid of character cells, and every page still a web page.',
  icons: { icon: asset('favicon.svg') },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

/** The families `next/font` declared, Plex's first, as a stack names them. */
const webFamilies = [siteMono, siteSymbols].map(
  (face) => face.style.fontFamily.split(',')[0]?.trim() ?? '',
);

/** A shut section of the map: its rows hidden, its mark turned. */
const sectionCss = NAV.filter((node) => (node.children?.length ?? 0) > 0)
  .map(
    ({ id }) =>
      `:root[data-site-shut~="${id}"] [data-site-section="${id}"]>.rk-link-tree-group,` +
      `:root[data-site-shut~="${id}"] [data-site-section="${id}"]>.rk-link-tree-row .site-tree-open{display:none}` +
      `:root[data-site-shut~="${id}"] [data-site-section="${id}"]>.rk-link-tree-row .site-tree-shut{display:inline}`,
  )
  .join('\n');

/**
 * Run as the parser reaches it, before the first paint: the map marks the
 * page you are on, so the reverse-video row is there in the first frame.
 */
const markCurrent = `(() => {
  const here = location.pathname.replace(/\\/?$/, '/');
  for (const a of document.querySelectorAll('.site-map a.rk-link-tree-link')) {
    if (a.getAttribute('href') !== here) continue;
    a.setAttribute('aria-current', 'page');
    // And scrolled into the map's view, if it is below it: a scroll, not a shift.
    const map = a.closest('[data-site-scroll]');
    const row = a.getBoundingClientRect();
    const view = map && map.getBoundingClientRect();
    if (view && row.bottom > view.bottom) map.scrollTop += row.bottom - view.bottom + view.height / 2;
  }
})();`;

/** And the look's buttons say the reader's look, which only the browser knows. */
const markLook = `(() => {
  let look = {};
  try { look = JSON.parse(localStorage.getItem(${JSON.stringify(STORAGE_KEY)}) || '{}') || {}; } catch {}
  for (const button of document.querySelectorAll('.site-status [data-site-look]')) {
    const part = button.dataset.siteLook;
    const value = button.querySelector('[data-site-look-value]');
    const chosen = typeof look[part] === 'string' && look[part] !== '' ? look[part] : null;
    if (!chosen || !value) continue;
    if (part === 'theme' && !(self.rockawayThemeNames || []).includes(chosen)) continue;
    value.textContent = chosen;
    button.setAttribute('aria-label', part[0].toUpperCase() + part.slice(1) + ': ' + chosen);
  }
})();`;

export default function RootLayout({
  children,
  outline,
}: {
  children: ReactNode;
  outline: ReactNode;
}): ReactNode {
  const bindings = shellBindings(NAV);
  return (
    // The pre-paint script changes these attributes before React hydrates.
    <html lang="en" data-rk-theme={SITE_THEME} suppressHydrationWarning>
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: the site's own script, written at build. */}
        <script dangerouslySetInnerHTML={{ __html: prePaint(THEME_URLS, themeNames) }} />
        <style
          // biome-ignore lint/security/noDangerouslySetInnerHtml: the faces and the glyph sets, written at build.
          dangerouslySetInnerHTML={{
            __html: `${fontFaces(webFamilies)}\n${glyphSetCss()}\n${sectionCss}`,
          }}
        />
      </head>
      <body>
        <a className="site-skip" href="#content">
          Skip to the page
        </a>
        <div className="site-shell">
          <nav className="site-pane site-map" id="site-map" aria-label="Site">
            <PaneChrome title="rockaway" />
            <div className="rk-scroll site-scroll" data-site-scroll="map">
              <div data-site-filter />
              <SiteTree items={NAV} sections />
            </div>
          </nav>
          {/* biome-ignore lint/security/noDangerouslySetInnerHtml: the site's own script, written at build. */}
          <script dangerouslySetInnerHTML={{ __html: markCurrent }} />
          <main id="content" className="site-pane site-main" tabIndex={-1}>
            {children}
          </main>
          <aside className="site-pane site-outline" aria-label="On this page">
            <PaneChrome title="on this page" />
            <div className="rk-scroll site-scroll" data-site-scroll="outline">
              {outline}
            </div>
          </aside>
          <Shell nav={NAV} bindings={bindings} />
          {/* biome-ignore lint/security/noDangerouslySetInnerHtml: the site's own script, written at build. */}
          <script dangerouslySetInnerHTML={{ __html: markLook }} />
        </div>
      </body>
    </html>
  );
}

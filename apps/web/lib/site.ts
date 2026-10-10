/**
 * The site's pages, as data the shell and the routes both read: the map, and
 * the theme stylesheets. Server-side only where it reads files.
 */
import { themeNames } from '@rockaway/tokens';
import { components, slugOf } from './components.ts';
import { SITE_THEME } from './look.ts';
import { type NavNode, siteNav } from './nav.ts';
import { asset } from './paths.ts';

/** The foundations pages, in order. */
export const FOUNDATIONS: readonly { readonly id: string; readonly title: string }[] = [];

/** The site's map: every page, in the order the sidebar shows it. */
export const NAV: readonly NavNode[] = siteNav({
  foundations: FOUNDATIONS,
  components: components.map((c) => ({ slug: slugOf(c.name), name: c.name })),
});

/** Every theme's stylesheet but the site's own and the default, which are in the main one. */
export const THEME_URLS: Readonly<Record<string, string>> = Object.fromEntries(
  themeNames
    .filter((name) => name !== SITE_THEME && name !== 'default')
    .map((name) => [name, asset(`themes/${name}.css`)]),
);

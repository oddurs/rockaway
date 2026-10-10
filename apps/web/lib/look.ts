/**
 * The reader's look (cairn 0148): which theme, which mode and which density
 * the site is drawn in, and how it is remembered.
 *
 * It is three context attributes on `<html>`, the same ones any rockaway page
 * uses: `data-rk-theme` for the theme, `data-theme` for the mode, and
 * `data-density` for the density. Left off, each falls back to what the
 * reader's system says: the default theme, the system's colour scheme, and
 * `touch` on a coarse pointer. So with no script, the page follows the system.
 *
 * The choice is kept in `localStorage`, and a script at the top of the head
 * applies it before the first frame, so a reader who chose dark never sees
 * light for one.
 */
export const MODES = ['system', 'light', 'dark'] as const;
export const DENSITIES = ['automatic', 'dense', 'normal', 'airy', 'touch'] as const;

export type Mode = (typeof MODES)[number];
export type Density = (typeof DENSITIES)[number];

export interface Look {
  readonly theme: string;
  readonly mode: Mode;
  readonly density: Density;
}

/** The site's own theme (0286): drawn when the reader has chosen none. */
export const SITE_THEME = 'sunset';

export const DEFAULT_LOOK: Look = { theme: SITE_THEME, mode: 'system', density: 'automatic' };

/** Where the choice is kept. */
export const STORAGE_KEY = 'rockaway:look';

/** A stored look, or the default for anything missing or not one of the choices. */
export function readLook(stored: string | null, themes: readonly string[]): Look {
  try {
    const raw = JSON.parse(stored ?? '{}') as Partial<Record<keyof Look, string>>;
    return {
      theme: themes.includes(raw.theme ?? '') ? (raw.theme as string) : DEFAULT_LOOK.theme,
      mode: (MODES as readonly string[]).includes(raw.mode ?? '')
        ? (raw.mode as Mode)
        : DEFAULT_LOOK.mode,
      density: (DENSITIES as readonly string[]).includes(raw.density ?? '')
        ? (raw.density as Density)
        : DEFAULT_LOOK.density,
    };
  } catch {
    return DEFAULT_LOOK;
  }
}

/** The look as the attributes it sets on `<html>`: a default is the attribute left off. */
export function attributesOf(look: Look): Record<string, string | undefined> {
  return {
    // The site's theme is a theme like any other: the attribute is always set.
    'data-rk-theme': look.theme,
    'data-theme': look.mode === 'system' ? undefined : look.mode,
    'data-density': look.density === 'automatic' ? undefined : look.density,
  };
}

/** The next of a list, round. */
export function next<T>(list: readonly T[], at: T, step = 1): T {
  const i = list.indexOf(at);
  return list[(i + step + list.length) % list.length] as T;
}

/** Where the shell's own state is kept: which sections of the map are shut, and which panes are hidden. */
export const SHELL_KEY = 'rockaway:shell';

/**
 * The script at the top of the head: it marks that script runs, reads the
 * reader's look and sets it on `<html>` before the body is parsed, and writes
 * the chosen theme's stylesheet into the head, so the first frame is drawn in
 * it. Written as a string, because it runs before any module could load;
 * `themeUrls` are the built stylesheets, by theme.
 *
 * It sets the shell's state too (0287): the map's shut sections, and whether
 * the map and the outline are hidden. Each is an attribute the stylesheet
 * lays the grid out from, so the first frame is the shell the reader left,
 * and no script moves a pane after it.
 *
 * `document.write` is deliberate; do not replace it. A stylesheet the parser
 * inserts blocks the first frame in every engine. One a script inserts with
 * `createElement` does not, so the page would paint once in the default theme
 * and then flash to the reader's. `blocking="render"` would fix that only in
 * Chromium. Writing the `<link>` from a classic, synchronous script in the
 * head is the one way to get a parser-inserted, render-blocking stylesheet
 * everywhere (0148, agreed with the CTO).
 */
export function prePaint(
  themeUrls: Readonly<Record<string, string>>,
  themes: readonly string[],
): string {
  return `(() => {
  const root = document.documentElement;
  root.dataset.rkScript = '';
  const read = (key) => { try { return JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch { return {}; } };
  const look = read(${JSON.stringify(STORAGE_KEY)});
  const urls = ${JSON.stringify(themeUrls)};
  const themes = ${JSON.stringify(themes)};
  // For the page's script, which switches the theme later.
  self.rockawayThemes = urls;
  self.rockawayThemeNames = themes;
  const modes = ${JSON.stringify(MODES.slice(1))};
  const densities = ${JSON.stringify(DENSITIES.slice(1))};
  if (themes.includes(look.theme)) {
    root.dataset.rkTheme = look.theme;
    // The site's theme and the default are in the stylesheet already.
    if (urls[look.theme]) document.write('<link rel="stylesheet" href="' + urls[look.theme] + '" data-rk-look="' + look.theme + '">');
  }
  if (modes.includes(look.mode)) root.dataset.theme = look.mode;
  if (densities.includes(look.density)) root.dataset.density = look.density;
  const shell = read(${JSON.stringify(SHELL_KEY)});
  if (Array.isArray(shell.shut)) root.dataset.siteShut = shell.shut.filter((s) => typeof s === 'string').join(' ');
  if (shell.map === 'hidden') root.dataset.siteMap = 'hidden';
  if (shell.outline === 'hidden') root.dataset.siteOutline = 'hidden';
})();`;
}

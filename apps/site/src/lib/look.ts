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
import { themeNames } from '@rockaway/tokens';

export const THEMES: readonly string[] = themeNames;
export const MODES = ['system', 'light', 'dark'] as const;
export const DENSITIES = ['automatic', 'dense', 'normal', 'airy', 'touch'] as const;

export type Mode = (typeof MODES)[number];
export type Density = (typeof DENSITIES)[number];

export interface Look {
  readonly theme: string;
  readonly mode: Mode;
  readonly density: Density;
}

export const DEFAULT_LOOK: Look = { theme: 'default', mode: 'system', density: 'automatic' };

/** Where the choice is kept. */
export const STORAGE_KEY = 'rockaway:look';

/** A stored look, or the default for anything missing or not one of the choices. */
export function readLook(stored: string | null): Look {
  try {
    const raw = JSON.parse(stored ?? '{}') as Partial<Record<keyof Look, string>>;
    return {
      theme: THEMES.includes(raw.theme ?? '') ? (raw.theme as string) : DEFAULT_LOOK.theme,
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
    'data-rk-theme': look.theme === 'default' ? undefined : look.theme,
    'data-theme': look.mode === 'system' ? undefined : look.mode,
    'data-density': look.density === 'automatic' ? undefined : look.density,
  };
}

/** The next of a list, round. */
export function next<T>(list: readonly T[], at: T, step = 1): T {
  const i = list.indexOf(at);
  return list[(i + step + list.length) % list.length] as T;
}

/**
 * The script at the top of the head: it marks that script runs, reads the
 * reader's look and sets it on `<html>` before the body is parsed, and writes
 * the chosen theme's stylesheet into the head, where the parser makes it
 * render-blocking, so the first frame is drawn in it. Written as a string,
 * because it runs before any module could load; `themeUrls` are the built
 * stylesheets, by theme.
 */
export function prePaint(themeUrls: Readonly<Record<string, string>>): string {
  return `(() => {
  const root = document.documentElement;
  root.dataset.rkScript = '';
  let look = {};
  try { look = JSON.parse(localStorage.getItem(${JSON.stringify(STORAGE_KEY)}) || '{}') || {}; } catch {}
  const urls = ${JSON.stringify(themeUrls)};
  // For the page's script, which switches the theme later.
  self.rockawayThemes = urls;
  const modes = ${JSON.stringify(MODES.slice(1))};
  const densities = ${JSON.stringify(DENSITIES.slice(1))};
  if (typeof look.theme === 'string' && urls[look.theme]) {
    root.dataset.rkTheme = look.theme;
    document.write('<link rel="stylesheet" href="' + urls[look.theme] + '" data-rk-look="' + look.theme + '">');
  }
  if (modes.includes(look.mode)) root.dataset.theme = look.mode;
  if (densities.includes(look.density)) root.dataset.density = look.density;
})();`;
}

/**
 * The shell's chrome is drawn on the server, once, with no script: the panes'
 * borders, the map's guides and its marks. A theme can change those glyphs
 * (sunset's corners are rounded, ascii's are `+`), and the reader's theme is
 * only known in the browser. So the server draws each piece once for every
 * set of glyphs the themes use, and the stylesheet shows the one the theme on
 * `<html>` names. The head's script sets that theme before the first frame,
 * so the right chrome is the first chrome, and no script ever redraws it.
 *
 * Themes are grouped by their border set. Every theme in a group must draw
 * the same marks too, or the build fails here rather than drawing one wrong.
 */
import { type Glyphs, themeGlyphs } from '@rockaway/tokens';
import { SITE_THEME } from './look.ts';

export interface GlyphSet {
  /** The border set's name, which is the set's name: `rounded`, `ascii`. */
  readonly name: string;
  readonly glyphs: Glyphs;
  readonly themes: readonly string[];
}

const all = themeGlyphs as Readonly<Record<string, Glyphs>>;

export const GLYPH_SETS: readonly GlyphSet[] = (() => {
  const sets = new Map<string, { glyphs: Glyphs; themes: string[] }>();
  for (const [theme, glyphs] of Object.entries(all)) {
    const name = glyphs.borderSet;
    const set = sets.get(name);
    if (set === undefined) {
      sets.set(name, { glyphs, themes: [theme] });
      continue;
    }
    if (JSON.stringify(set.glyphs.mark) !== JSON.stringify(glyphs.mark)) {
      throw new Error(
        `${theme} draws ${name} borders with marks of its own: give the shell a glyph set for it`,
      );
    }
    set.themes.push(theme);
  }
  return [...sets].map(([name, { glyphs, themes }]) => ({ name, glyphs, themes }));
})();

/** The set the site's own theme draws in: what a reader with no script sees. */
export const SITE_SET: string = all[SITE_THEME]?.borderSet ?? 'single';

/**
 * Which drawing shows, by theme: every set's drawing is hidden but the one
 * the theme on `<html>` uses, and the site's own when no theme is named.
 * Unlayered, so it outranks the system's `display` on what it hides; the one
 * shown goes back to the system's own (`revert-layer`), an elastic frame's
 * flex column or a guide's inline flex.
 */
export function glyphSetCss(): string {
  const shown = GLYPH_SETS.flatMap((set) =>
    set.themes.map((theme) => `:root[data-rk-theme="${theme}"] [data-site-glyphs="${set.name}"]`),
  );
  return [
    '[data-site-glyphs]{display:none}',
    `:root:not([data-rk-theme]) [data-site-glyphs="${SITE_SET}"],${shown.join(',')}{display:revert-layer}`,
  ].join('\n');
}

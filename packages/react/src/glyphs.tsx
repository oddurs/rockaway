/**
 * Glyphs from the theme (cairn 0119).
 *
 * A theme owns its characters: its border set, its cursor, its scrollbar, the
 * delimiters around a button. The tokens are CSS custom properties, but chrome
 * is drawn into a buffer in JavaScript, possibly on a server, and reading
 * computed style there is impossible and on the client forces a layout. So
 * the theme's resolved `Glyphs` reach components through context instead.
 *
 * With no provider a component gets the default theme's glyphs, so it works
 * on its own and renders on a server.
 */
import { type Glyphs, themeGlyphs } from '@rockaway/tokens';
import { createContext, type ReactNode, useContext } from 'react';

/** The default theme's glyphs: what a component draws with when nothing says otherwise. */
export const defaultGlyphs: Glyphs = themeGlyphs.default;

const GlyphContext = createContext<Glyphs>(defaultGlyphs);

export interface GlyphProviderProps {
  /** A theme's glyphs: `themeGlyphs.ink`, or `glyphsFor({ borderSet: 'ascii' })`. */
  readonly glyphs: Glyphs;
  readonly children?: ReactNode;
}

export function GlyphProvider({ glyphs, children }: GlyphProviderProps): ReactNode {
  return <GlyphContext.Provider value={glyphs}>{children}</GlyphContext.Provider>;
}

/** The only way a component gets a character to draw with. */
export function useGlyphs(): Glyphs {
  return useContext(GlyphContext);
}

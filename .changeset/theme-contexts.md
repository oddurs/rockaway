---
'@rockaway/tokens': minor
'@rockaway/css': patch
---

Breaking: the DTCG files and the palette's custom properties are restructured (below). Every theme is a CSS context. `data-rk-theme="ink"` on any element switches that subtree to the ink theme, the way `data-theme` switches mode and `data-density` switches density, and the three nest in any order. The default theme stays in `tokens.css`. Every other theme ships as `@rockaway/tokens/themes/<name>.css`, loaded after it.

Five well-known terminal palettes ship beside the presets: Catppuccin (Latte and Mocha), Dracula, Nord, Solarized and Tokyo Night (Day and Night). Each is imported from its upstream terminal theme, with its source and licence recorded in `themes/terminal/`. A theme with one mode pins it. Every theme passes the contrast gate in every mode it declares, and a colour that fell short was moved in lightness, keeping its hue. The moves are printed by the generator and recorded in the theme's DTCG file. `themeContexts`, `themeFromInputs`, `presetNames` and `importedNames` are new; `themes` and `themeGlyphs` now cover every theme.

Breaking, for anything that reads the DTCG files or the CSS directly:

- `palette.{light,dark}.tokens.json` are gone. Raw colours are in `theme.<name>.tokens.json` under `palette.light.*` and `palette.dark.*`. The new `mode.{light,dark}.tokens.json` point `ansi.*` at one half, and the resolver gains a `theme` modifier. Fonts and glyphs move from `base.tokens.json` into the theme files too.
- In CSS, `--rk-ansi-*` is now `light-dark()` over `--rk-palette-light-*` and `--rk-palette-dark-*`, and `[data-theme]` only sets `color-scheme`. Reading `--rk-ansi-*` or a semantic colour from `getComputedStyle` returns the `light-dark()` pair rather than a single colour; the element's own `color` and `background-color` still resolve to one.
- `checkContrast` reports a `theme` on each result, and checks every theme the resolver names.

`@rockaway/css`: forced colors now remaps the palette on every theme island as well as the root, so a theme cannot bring its own colours back inside one.

---
'@rockaway/tokens': minor
'@rockaway/react': minor
'@rockaway/grid': minor
---

Components draw with the theme's glyphs. `@rockaway/tokens` exports `glyphsFor(inputs)`, `themeGlyphs` for every theme that ships, and the presets themselves as `themes`, and adds the marks controls will need: `glyph.delimiter.control`, `mark.blank`, the switch thumb and track, sort ascending and descending, overflow start and end, required, danger and external. `@rockaway/react` adds `GlyphProvider` and `useGlyphs()`; Frame, Divider, List and Button read from it, so a theme whose border set is `ascii` draws its boxes, cursor, scrollbar and truncation in ASCII. With no provider, components use the default theme's glyphs. `@rockaway/react` now depends on `@rockaway/tokens`. `drawBox` and `drawText` in `@rockaway/grid` take an `ellipsis` option, which defaults to `…`.

# Themes

Every theme is a context: an attribute on any element, which nests in any
other. Each one below is the real thing, an island of `data-rk-theme` in each
mode the theme declares, with a screen drawn in its border set and its sixteen
colours in a row.

```html
<aside data-rk-theme="nord">…</aside>
```

The default theme is in `tokens.css`. Every other is a stylesheet of its own,
imported after it, and its border set and marks come from `themeGlyphs` through
`GlyphProvider`, because chrome is drawn in JavaScript. A theme with one mode,
like Dracula, pins it.

Every theme is also a set of terminal files, so the palette you read the
documentation in is the palette you can put in your terminal.

<!-- part: themes -->

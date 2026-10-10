---
'@rockaway/react': minor
'@rockaway/tokens': minor
---

Draw every component's snapshots in each theme's glyphs. A snapshot in the metadata keeps `text`, drawn with the default theme, and gains `themes`, each other theme's drawing by name, for the themes that draw it differently: today ink, in rounded corners, and phosphor, in double lines. A `.meta.ts` writes a snapshot as `draw: (glyphs) => string` to have it drawn in every theme, or as `text` for one that shows a single set on purpose; `SnapshotInput` is exported. `tokens.css` gains `data-rk-theme-only`: an element marked `data-rk-theme-only="ink phosphor"` is shown only where the nearest theme context is one it names (`default` is the page with none), so a page can carry each drawing and show the reader's without a script.

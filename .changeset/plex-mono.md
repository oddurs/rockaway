---
'@rockaway/tokens': minor
'@rockaway/css': patch
---

Set the default theme, every preset and every imported theme in IBM Plex Mono, whose italic is a face of its own. `--rk-font-family-mono` is now `"IBM Plex Mono"` followed by the system's monospace stack. The `system` pairing is still there for a theme that wants it. The tokens name the family; load the font yourself, its italic included, for example from `@fontsource/ibm-plex-mono`.

The base stylesheet sets `font-synthesis-style: none`, so an italic is the face's own or none at all. A slant the browser fakes leans a glyph over the edge of its cell.

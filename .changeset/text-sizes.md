---
'@rockaway/react': minor
'@rockaway/css': minor
'@rockaway/tokens': minor
---

Add `Text`, a sized heading and display primitive: sizes 2, 3 and 4, where each size N fills N rows exactly at the current density. The glyphs' ascent plus descent, over the em, comes from the face's content height (new token `--rk-font-content`), and a size scales the font so the glyph box is N rows. Across, letters keep their natural advance and an inline run's box rounds up to whole cells. Measured at every density and in both painters; a server renders its chrome and a client hydrates the text. Implementation closes 0296 and 0297.

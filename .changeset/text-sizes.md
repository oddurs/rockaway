---
'@rockaway/react': minor
'@rockaway/css': minor
'@rockaway/tokens': minor
---

Add `Text`, type sized in rows: `<Text size={2} as="h1">` for a title two rows tall, `<Text size={3} inline>` for a display word in a line. Size N, 2 to 4, scales the font so its glyph box, the face's ascent plus descent, is exactly N rows at the density in force; the letters keep their own advance, and a run set inline is a box rounded up to whole cells. The stylesheet does all of it, so it is right with no script. `@rockaway/css` gains `.rk-text`, `.rk-text-glyphs` and `.rk-text-inline`, driven by `--rk-size` and, inline, `--rk-chars`. `@rockaway/tokens` gains `font.content` (`--rk-font-content`, `contentHeight`), each face's glyph box over the em, which a page that sets its own face sets beside `--rk-font-family-mono`. `textScale`, `textCols` and `textBuffer` are exported, and `checkConformance` reports sized text on a strict screen as a `SizedText` violation, since strict is one size.

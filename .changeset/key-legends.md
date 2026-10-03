---
'@rockaway/tokens': minor
'@rockaway/react': minor
---

Draw key legends from the theme, and decide the keyboard in one place. `@rockaway/tokens` adds `glyph.key.*` (`keyLegends`, and `key` on every `Glyphs`): symbols in Unicode, with `⏎` for Enter, and words in ASCII. KeyHint reads them, so an ASCII theme draws `Cmd+Shift+K` where Unicode stacks `⌘⇧K`. `usePlatform()` and `detectPlatform()` in `@rockaway/react` decide which keyboard a chord is drawn for, preferring `navigator.userAgentData`, without a hydration mismatch, and KeyHint and Button share them, so a button that draws `⌘S` now announces `Meta+s` rather than `Control+s`. `formatKeys` takes the glyphs as an optional fourth argument.

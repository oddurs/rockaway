---
'@rockaway/react': minor
---

`@rockaway/react/testing` adds `checkNames`, `expectNames` and `formatNames`. They fail any accessible name that holds a glyph: box drawing, a block, a geometric shape, a dingbat, braille, or one of the theme's marks. Prose punctuation the theme also uses as a mark (`…`, `–`, `·`) is allowed. `checkField` already held a field's names to this rule, and now shares its definition of a glyph.

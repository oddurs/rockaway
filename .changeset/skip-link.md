---
'@rockaway/react': minor
'@rockaway/css': minor
---

Add `SkipLink`, the way past what repeats on every page: `<SkipLink target="main">` is an anchor to `#main`, out of sight until it has focus, then a run of reversed cells at the top-left of the screen it is in, the label with a cell of air either side, one row tall. It overlays that corner, so showing it moves nothing, and it is hidden by a clip, so it stays in the tab order and the accessibility tree. Activating it follows the anchor and moves focus to the target, giving the target `tabindex="-1"` when it cannot take focus. It draws no glyph, so it reads the same in every theme, and in forced colors it keeps its reversal as the reader's text and canvas swapped. Without React, `<a class="rk-skip-link" href="#main">` with `@rockaway/css` is the same link. `skipLinkBuffer` draws it as text.

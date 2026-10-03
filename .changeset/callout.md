---
'@rockaway/react': minor
'@rockaway/css': minor
---

Add `Callout`, a framed note, tip, warning or caution inside prose: the `tone` variant is `note`, `tip`, `warning` or `danger`, and each is a border weight (light, rounded, heavy, double) and a mark (`●`, `✓`, `!`, `✗`) as well as a colour, set into the top edge with the title, which is also the callout's name as a `note`. The frame is drawn by the engine to the whole cells of the width it is given, and the content is in the page's flow, so the callout is exactly as tall as what it holds and never scrolls. `calloutBuffer` draws it as text, and `calloutChrome` gives its line, heading and colours as data for a page that sets callouts without a script; `.rk-callout-static` in `@rockaway/css` is that static form, its lines drawn by the cell. `screenshot()` from `@rockaway/react/testing` now reads text that wraps onto several rows where each row of it is.

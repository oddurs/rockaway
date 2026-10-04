---
'@rockaway/react': minor
'@rockaway/css': minor
---

Add `Panes` and `Pane`: a screen split into framed panes that share their borders. Where two panes meet, the junction table draws a tee or a crossing, and each pane's title sits in its own top edge. A `Pane` whose only child is a `Panes` is split again inside the same borders. Sizes are cells, `'2fr'` or `'auto'`, solved in whole cells by the layout solver. When the screen is too narrow for every pane's `min`, the lowest `priority` collapses first, hidden rather than unmounted. `layoutPanes` and `panesBuffer` give the same layout with no DOM. A titled pane is a region named by its title. `@rockaway/css` ships `panes.css`, which places each pane in whole cells.

`Screen` now also takes a function as its children, which it calls with the size it drew at, in cells, for content laid out by the same layout as the chrome.

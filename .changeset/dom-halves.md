---
'@rockaway/react': minor
---

Add `@rockaway/react/dom`: the DOM halves of Screen, Panes and StatusBar, for a page that renders them on a server and runs no React. `measureScreen` measures a screen as `Screen` does. `relayoutPanes` lays a server-rendered `Panes` out at the size its box has, and `fitStatusBar` fits a server-rendered `StatusBar` to its width. Each calls the same pure functions the component calls (`layoutPanes`, `fitStatus`, `paintCells`) and writes what the component writes; a workbench story lays each out both ways at the same size and reads them back cell for cell.

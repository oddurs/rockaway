---
'@rockaway/react': minor
---

`checkConformance` holds an overlay's surface to the grid it was moved onto: the cell grid of the screen its trigger is in, not its own. An overlay is a screen of its own, so its boxes were measured from its own corner and a surface a fraction of a cell off its trigger's grid passed. The surface now records the element it was opened from, and its corner is measured in the cells of that element's screen (a sheet across from the viewport's edge, as it is placed); a surface off that grid is a new `anchor` violation, `OffAnchor`, naming the axis and the screen it was opened from.

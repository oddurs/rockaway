---
id: 85
title: 'Paint to the DOM: the glyph and rule painters'
type: feature
status: done
milestone: grid
assignee: Oddur Sigurdsson
depends_on:
- 72
- 82
created: 2026-09-22
updated: 2026-09-22
closed_at: 2026-09-22
priority: p0
layer: grid
effort: l
---

## Proposal

Two painters over one geometry: characters for the TUI look, CSS hairlines for
people who want crisp lines at any zoom.

## Acceptance criteria

- [x] `glyph` writes box characters into a frame layer, `aria-hidden`, never in the accessible name
- [x] `rule` draws the same geometry as 1px lines on the cell boundary, taking no cell
- [x] The two are interchangeable per box and per theme; a screen may mix them
- [x] Neither paints anything a screen reader announces, and both survive forced-colors
- [x] The same buffer renders identically in both, measured in cells

## 2026-09-22

The painters live in @rockaway/react rather than @rockaway/grid because 0071 keeps the engine free of the DOM. They are plain DOM functions with no React in them, exported at @rockaway/react/paint, so a server render or a static page can call them too. Tested in a real browser rather than a simulated one, since what matters — that both painters measure the same in cells — only exists once CSS is applied.

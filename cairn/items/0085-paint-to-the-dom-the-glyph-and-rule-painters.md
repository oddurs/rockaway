---
id: 85
title: 'Paint to the DOM: the glyph and rule painters'
type: feature
status: backlog
milestone: grid
depends_on:
- 72
- 82
created: 2026-09-22
updated: 2026-09-22
priority: p0
layer: grid
effort: l
---

## Proposal

Two painters over one geometry: characters for the TUI look, CSS hairlines for
people who want crisp lines at any zoom.

## Acceptance criteria

- [ ] `glyph` writes box characters into a frame layer, `aria-hidden`, never in the accessible name
- [ ] `rule` draws the same geometry as 1px lines on the cell boundary, taking no cell
- [ ] The two are interchangeable per box and per theme; a screen may mix them
- [ ] Neither paints anything a screen reader announces, and both survive forced-colors
- [ ] The same buffer renders identically in both, measured in cells

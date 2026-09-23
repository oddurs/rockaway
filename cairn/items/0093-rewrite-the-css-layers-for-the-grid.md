---
id: 93
title: Rewrite the CSS layers for the grid
type: feature
status: backlog
milestone: retheme
depends_on:
- 90
- 91
created: 2026-09-22
updated: 2026-09-22
priority: p0
layer: css
effort: l
---

## Acceptance criteria

- [ ] The base layer sets the monospace rhythm: one size, line box from the density, ligatures off
- [ ] Focus is reverse video on filled controls and the outline elsewhere, both contrast-checked
- [ ] Selection, placeholder and disabled read as attributes, not as new colours
- [ ] Forced colors maps onto the ANSI roles, keeping 0027's promise
- [ ] Cell utilities and the container-query steps at 40, 60, 80 and 120 cells

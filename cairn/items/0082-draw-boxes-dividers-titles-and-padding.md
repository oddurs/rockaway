---
id: 82
title: Draw boxes, dividers, titles and padding
type: feature
status: backlog
milestone: grid
depends_on:
- 79
- 80
- 81
created: 2026-09-22
updated: 2026-09-22
priority: p0
layer: grid
effort: m
---

## Acceptance criteria

- [ ] A box of any border set, with padding in cells and an optional title set into its top edge
- [ ] A title truncates with the border, never past it, and reads correctly in the text painter
- [ ] Dividers inside a box join its sides (`├`, `┤`) through the junction model
- [ ] A frame is drawn from a solved layout, so a box never disagrees with the space it was given

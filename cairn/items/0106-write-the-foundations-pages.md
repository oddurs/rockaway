---
id: 106
uid: 7cfb14bd-1ca0-442d-97e6-22993faf897d
title: Write the foundations pages
type: docs
status: backlog
milestone: site
depends_on:
- 52
- 104
- 138
- 143
created: 2026-09-22
updated: 2026-10-03
priority: p0
layer: docs
effort: l
---

## Acceptance criteria

- [ ] The grid: the cell, the rules, the six inputs
- [ ] Strictness: the three levels, and how to declare an exception you mean
- [ ] Glyphs: the border sets, the junction table, what happens to CJK and emoji
- [ ] Colour: the ANSI 16, the roles, the contrast gate, and importing a terminal theme
- [ ] Every page is itself drawn by the system, and every example is copyable
- [ ] A token reference generated from the DTCG sources, not written by hand
- [ ] Every shipped theme (0052) shown, with its terminal files for Ghostty, kitty, Alacritty and iTerm2 to download
- [ ] Accessibility: what is tested (axe, conformance, continuity, forced colors, the screen-reader pass) and the known limits from the concept's "Where it is thin"

## 2026-10-03

Rewritten by the program plan: the pre-pivot template text is replaced with how this works on the grid, the criteria are one list (the template, plus the contracts from the plan, plus this item's own), and the dependencies point at the contracts it is built on.

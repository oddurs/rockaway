---
id: 88
title: Enforce grid conformance, and count the exceptions
type: chore
status: backlog
milestone: grid
depends_on:
- 72
- 86
created: 2026-09-22
updated: 2026-09-22
priority: p0
layer: tooling
effort: m
---

## Acceptance criteria

- [ ] Every rendered box measures a whole number of cells, at every density and in every theme
- [ ] A box off the grid fails unless it carries `data-rk-offgrid="reason"`
- [ ] The report lists every declared exception with its reason, so they can be counted and argued about
- [ ] Runs in CI over the workbench, and later over the built site
- [ ] `strict` is a mode CI runs, not a mode we hope works

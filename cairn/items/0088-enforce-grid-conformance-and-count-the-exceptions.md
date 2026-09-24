---
id: 88
title: Enforce grid conformance, and count the exceptions
type: chore
status: done
milestone: grid
assignee: Oddur Sigurdsson
depends_on:
- 72
- 86
created: 2026-09-22
updated: 2026-09-23
closed_at: 2026-09-23
priority: p0
layer: tooling
effort: m
---

## Acceptance criteria

- [x] Every rendered box measures a whole number of cells, at every density and in every theme
- [x] A box off the grid fails unless it carries `data-rk-offgrid="reason"`
- [x] The report lists every declared exception with its reason, so they can be counted and argued about
- [x] Runs in CI over the workbench, and later over the built site
- [x] `strict` is a mode CI runs, not a mode we hope works

## 2026-09-23

Two things the harness found on its first run. A screen's own box is sized by the page — 480.5px cannot be whole cells — so the check governs what is drawn inside a screen, not the screen itself. And a screen given a size in cells now sizes itself in cells, instead of making the caller compute `ch` in whatever font the page happens to use, which is what the failing measurement was really telling us.

## 2026-09-23

Refined by 0099: inline boxes are measured across but not down, and visually hidden boxes are skipped. Neither is a loophole — an inline box's height is a font metric, and clipped text has no visual geometry. Without this every component with a spoken form or a <code> span would need a declared exception, which is the noise the dial exists to avoid.

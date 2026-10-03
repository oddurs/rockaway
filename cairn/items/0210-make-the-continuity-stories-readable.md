---
id: 210
uid: bbfe101f-e008-44b1-a43d-3e1c47a8eed4
title: Make the continuity stories readable
type: chore
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 117
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
priority: p1
layer: tooling
effort: s
---

## Problem

The owner, looking at Grid/Continuity in the workbench: "what is that second to
last thing — what is going on there?" It was the block-elements fixture, drawing
correctly but as an unlabelled 14×6 jumble that reads as corrupted pixels; and
the junction frames were so narrow that every title truncated to `si…` before
the column rule's `┬` — correct under 0175, and indistinguishable from a bug. A
story that looks broken is a bad story, and this workbench is shown to people.

## Acceptance criteria

- [x] Every block fixture row carries its name (shades, eighth bars, halves, eighth edges, quadrants, solid run, shade runs)
- [x] Every junction frame is wide enough that its title reads whole, and the play function requires it
- [x] The continuity assertions are exactly as strong as before

## 2026-10-03

Blocks: one row per kind, named in fg.muted, scrollbar thumb over track down the right edge; groups share a column so rows still meet. Junction frames 18 cells, rule at 11, so every title reads whole; mixed frames titled mixed and weights. Play function requires whole titles and named block rows; 0175's ellipsis stays proved by label.test.ts. Continuity counts unchanged (18 layers, >600 shapes, >500 joins, 8 fills; SubPixel 27 layers, >900 joins).

## 2026-10-03

At 200% Chrome snaps a background to whole CSS pixels, so a mark reaching an edge on a half-pixel boundary spills a device pixel into the next cell; the leak check reads that as ink on an edge with no line. The old fixture was exposed too (▄ over ▗) and passed by where it happened to land. The block rows and the quadrants are ordered so every edge-reaching mark meets a mark reaching the same edge, or nothing; SubPixel's stacked screens get a row of air so one screen's edge ink is not read in the next. Proposed follow-up: let the leak rule allow a neighbour's reaching ink within the same half-CSS-pixel slack the reach rule already allows.

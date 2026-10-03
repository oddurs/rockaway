---
id: 210
uid: bbfe101f-e008-44b1-a43d-3e1c47a8eed4
title: Make the continuity stories readable
type: chore
status: backlog
milestone: primitives
depends_on:
- 117
created: 2026-10-03
updated: 2026-10-03
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

- [ ] Every block fixture row carries its name (shades, eighth bars, halves, eighth edges, quadrants, solid run, shade runs)
- [ ] Every junction frame is wide enough that its title reads whole, and the play function requires it
- [ ] The continuity assertions are exactly as strong as before

---
id: 67
key: grid
title: The frame engine
type: milestone
status: done
depends_on:
- 3
created: 2026-09-22
updated: 2026-09-23
closed_at: 2026-09-23
priority: p2
due: 2026-12-06
---

The heart of a TUI system: a pure, integer model of a character grid, and
painters that put it on a screen.

Everything else waits on this, because a frame drawn four different ways has
to come from one geometry. Done means a screen can be composed in cells,
rendered to characters, to the DOM, to ANSI, and compared as text in a test.

Concept: [docs/concept.md](../../docs/concept.md)

## 2026-09-23

Done 2026-09-23, ahead of the 2026-12-06 due date. The engine is pure integer geometry with no DOM: a cell buffer, weighted edges resolved from the Unicode block, text measured in cells, an integer layout solver, box drawing, and four painters — text, ANSI, glyph and rule. Two things exist now that a pixel system cannot have: screens compared as text, and a conformance check that fails on any box off the grid unless it declares a reason.

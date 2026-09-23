---
id: 74
title: Derive the cell from the font, and let touch grow the cell
type: decision
status: done
milestone: grid
created: 2026-09-22
updated: 2026-09-22
closed_at: 2026-09-22
priority: p0
layer: css
effort: m
---

## Context

A character grid on the web has to survive three things a terminal never
faces: a reader who zooms, a phone, and a finger. A 20px row is a fine
terminal line and a poor touch target, and WCAG asks for 24px minimum with
44px recommended.

## Options

- **Fixed pixel cell** — predictable, and it breaks zoom and accessibility outright
- **Scale the layout on touch** (fewer columns, bigger everything) — two layouts to maintain, and the grid stops being one grid
- **Scale the cell** — the geometry is identical; the cells are simply bigger

## Decision

Scale the cell. Decided 2026-09-23.

- `cell.width` is `1ch` of the theme's font; `cell.height` is the line box. Both come from font metrics, in `rem`, so browser zoom and the reader's font size work untouched.
- **Density is the row**: `dense 1.0`, `normal 1.25`, `airy 1.5`, and **`touch 2.0`**, which puts a one-row control at about 44px without changing a single coordinate.
- `touch` is selected by `pointer: coarse`, and can be forced. Controls that must be hit stay at least one cell tall at every density; the test asserts the rendered target, not the token.
- **Responsiveness is column count.** A screen asks how many cells it has and lays out accordingly, through container queries written in `ch`. The breakpoints are 40, 60, 80 and 120 cells: the widths terminals have always used.
- At 400% zoom the cell grows and the column count falls, which is reflow (WCAG 1.4.10) for free.

## Consequences

- One layout model for a phone, a laptop and a 4K terminal-sized window
- Any component that hard-codes a pixel is a bug the conformance test catches
- `ch` in a proportional font is meaningless, so the base font is monospace by definition, including in prose

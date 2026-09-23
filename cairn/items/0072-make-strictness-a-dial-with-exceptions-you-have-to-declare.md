---
id: 72
title: Make strictness a dial, with exceptions you have to declare
type: decision
status: done
milestone: grid
created: 2026-09-22
updated: 2026-09-22
closed_at: 2026-09-22
priority: p0
layer: grid
effort: m
---

## Context

A grid that cannot be broken is a grid people quietly abandon. A grid that can
be broken anywhere is decoration. Some readers want every edge on the line;
others want the look and a free hand with spacing.

## Options

- **Strict only** — pure, and it will lose the people who need one off-grid thing
- **Advisory** — nothing to enforce, so it stops being a grid
- **Levels, with declared exceptions** — pick how strict this app is, and break the rule out loud when you mean to

## Decision

Three conformance levels, set per app and readable per component. Decided 2026-09-23.

| Level | Layout | Frames | Spacing | Type |
| --- | --- | --- | --- | --- |
| `strict` | every box a whole number of cells | glyphs only | whole cells | one size |
| `standard` (default) | whole cells | glyph or rule painter | whole cells, half a cell inside controls | one size, plus a display size on a 2-cell row |
| `loose` | whole cells for panes, free inside them | any painter, radius allowed | any | any |

**An exception is a declaration, not a workaround.** Anything off the grid
carries `data-rk-offgrid="reason"`. The conformance test fails on every box
that does not measure whole cells *unless* it carries one, and the reason is
printed in the report, so exceptions are visible and countable rather than
quietly accumulated.

**Rules broken on purpose, in the system itself:** the focus ring is an
outline that costs no cell; overlay shadows in `loose` sit outside the grid;
touch targets grow the cell rather than the box (0000-cell-metrics).

## Consequences

- The level is a theme input, so a screenshot says which level it was built at
- `strict` is a real mode we test in CI, not an aspiration
- The exception attribute is public API and needs a lint rule of its own, so it cannot be used without a reason

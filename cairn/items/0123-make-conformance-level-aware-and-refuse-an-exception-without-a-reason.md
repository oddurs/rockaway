---
id: 123
uid: 536caf67-bae5-44e9-a762-64905390f525
title: Make conformance level-aware, and refuse an exception without a reason
type: feature
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 72
- 88
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
priority: p1
layer: tooling
effort: m
---

## Problem

0072 defined three levels with different rules, and `checkConformance` knows
none of them: it checks every box for whole cells at every level, and never
checks that `strict` uses the glyph painter. It also accepts
`data-rk-offgrid=""` and prints "no reason given", which is exactly the quiet
exception 0072 exists to forbid ("needs a lint rule of its own, so it cannot
be used without a reason").

## Proposal

The level is read from `data-rk-conformance` on the nearest ancestor (falling
back to the theme's `conformance` token) and the rules follow 0072's table:

| Level | Checked |
| --- | --- |
| `strict` | every box whole cells; the glyph painter only |
| `standard` | every box whole cells, except half a cell inside a control (`[data-rk-control]`); either painter |
| `loose` | screens and panes whole cells; anything inside a pane is free |

An exception with an empty or whitespace-only reason is a violation of its
own.

## Acceptance criteria

- [x] `checkConformance` reads the level, and each level's rules are covered by a test that passes at one level and fails at a stricter one
- [x] `strict` fails a screen painted by the rule painter
- [x] An empty or whitespace reason fails, with a message that says so
- [x] The report groups exceptions by reason and counts them, so a page can say "3 exceptions, 2 reasons"
- [x] The workbench runs at `standard` by default and has a story pinned at each level

## 2026-10-03

The level belongs to the screen (data-rk-conformance on it or an ancestor, then the theme's --rk-conformance token, then standard), not to a box inside it, so a component cannot loosen the app it is placed in. Nested screens are measured by both their own pass and their parent's, so nesting can tighten the level but never relax it. --rk-conformance is new: the theme input existed but was never emitted, so the 'theme token' fallback had nothing to read; it is generated as a string token the way the glyphs are.

## 2026-10-03

An empty reason excuses nothing: it is a violation of its own and the box under it is measured as if the attribute were absent, so the report also shows what it was hiding. A data-rk-conformance value that names no level is a violation too, so a typo cannot quietly mean standard. Strict reads the painter from data-rk-painted (what was painted) rather than the painter prop, so chrome painted without Screen is held to it as well.

## 2026-10-03

Nothing in the components sets data-rk-control or data-rk-pane yet, so the half-cell allowance and the loose pane rule are exercised only by the workbench fixtures. Ran the whole workbench at strict once: the only failures are stories that use the rule painter on purpose (Frame Ruled, Link Painters, Screen, Continuity, Painters) and the half-cell fixture. No component is off the grid at strict at normal density in light mode.

## Result

checkConformance reads the level per screen (data-rk-conformance, then --rk-conformance, then standard) and reports it in report.levels and on every violation; strict = whole cells + glyph painter, standard = half cells inside [data-rk-control], loose = only screens and [data-rk-pane]. Empty reasons fail; report.reasons groups exceptions by reason.

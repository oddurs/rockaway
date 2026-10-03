---
id: 123
uid: 536caf67-bae5-44e9-a762-64905390f525
title: Make conformance level-aware, and refuse an exception without a reason
type: feature
status: backlog
milestone: primitives
depends_on:
- 72
- 88
created: 2026-10-03
updated: 2026-10-03
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

- [ ] `checkConformance` reads the level, and each level's rules are covered by a test that passes at one level and fails at a stricter one
- [ ] `strict` fails a screen painted by the rule painter
- [ ] An empty or whitespace reason fails, with a message that says so
- [ ] The report groups exceptions by reason and counts them, so a page can say "3 exceptions, 2 reasons"
- [ ] The workbench runs at `standard` by default and has a story pinned at each level

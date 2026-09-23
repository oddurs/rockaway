---
id: 112
title: 'Write the concept doc: how a TUI becomes a web page'
type: docs
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 111
created: 2026-09-23
updated: 2026-09-23
closed_at: 2026-09-23
priority: p0
layer: docs
effort: m
---

## Problem

The concept lives in code comments, in the bodies of a dozen closed items, and
in two canvases that have since been deleted. A new reader — or a contributor,
or the author in six months — has nowhere to read *why* the system is shaped
this way before touching a component.

## Proposal

`docs/concept.md`: one document that states the model, the rules that follow
from it, what we borrowed and from whom, and where it is thin. The README sells
it; this explains it. It is the reference the primitives are held to, so it has
to exist before they are built.

## Acceptance criteria

- [x] The model stated once: the cell, frames as data, the two layers, painters
- [x] The rules a component must follow, numbered and quotable in review
- [x] Prior art credited honestly: what is standard TUI architecture, what is ours
- [x] Known limits written down rather than discovered later
- [x] Linked from the README, and from the items that used to cite the canvases
- [x] The component template carries the grid rules, so new items inherit them

## 2026-09-23

Written as docs/concept.md, 249 lines. Structure: the model (frames as data, the cell, the four routes, two layers, painters, strictness, snapshots, terminal themes), then what we borrowed and from whom, then where it is thin, then the ten-rule component contract. Two claims were checked against the code rather than memory while writing: glyphFor takes a border set, and the junction merge is tested commutative, associative and idempotent (packages/grid/test/junction.test.ts:82).

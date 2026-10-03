---
id: 134
uid: 81da40c9-f860-478e-8c2f-81e0fc674dee
title: 'Write the component recipe: the files, the export lines, the checklist'
type: docs
status: backlog
milestone: primitives
depends_on:
- 32
- 47
- 122
- 131
created: 2026-10-03
updated: 2026-10-03
priority: p1
layer: docs
effort: s
---

## Problem

Fifteen components are about to be written by different hands at once. The
conventions exist only in Button's source and in item notes. Each engineer
will rediscover them, and the reviewer will see fifteen variations.

## Proposal

`docs/component-recipe.md`, written from polished Button (0131) as the worked
example: the files a component adds and where (`components/<name>.tsx`,
`css/src/components/<name>.css`, `<name>.meta.ts`, the story, the snapshot
test), the one line each barrel gets (0122), how variants are declared
(0032), how glyphs are read (0119), which state-vocabulary row each state uses
(0118), and the ten rules as a pre-review checklist with how each is proven.

## Acceptance criteria

- [ ] `docs/component-recipe.md` exists, linked from CONTRIBUTING and from the component template's description in `cairn.toml`
- [ ] Following it from a blank file produces a component that passes `pnpm check` (proven by the first wave-3 component, which records anything the recipe missed here)
- [ ] Every one of the ten rules has a line saying which test proves it

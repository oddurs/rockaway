---
id: 134
uid: 81da40c9-f860-478e-8c2f-81e0fc674dee
title: 'Write the component recipe: the files, the export lines, the checklist'
type: docs
status: review
milestone: primitives
assignee: Oddur Sigurdsson
claimed: 2026-10-03
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

- [x] `docs/component-recipe.md` exists, linked from CONTRIBUTING and from the component template's description in `cairn.toml`
- [ ] Following it from a blank file produces a component that passes `pnpm check` (proven by the first wave-3 component, which records anything the recipe missed here)
- [ ] Every one of the ten rules has a line saying which test proves it

## 2026-10-03

From 0164: the recipe's story section must say that a play function which hovers, presses with the pointer or compares geometry starts with await settled() from apps/workbench/src/settled.ts. CONTRIBUTING says so meanwhile. 0164's third criterion is ticked only when this recipe says it.

## 2026-10-03

0127 put the recipe for building a field from Label, Description, FieldError, FieldFrame, Fieldset and fieldClass in CONTRIBUTING.md, under 'Building a field', marked as interim. Move it into docs/component-recipe.md as its own section when this is written, and leave a link behind.

## 2026-10-03

From 0208: the recipe must say that anything that scrolls takes rk-scroll (no native scrollbar, decision 0207) and shows its position in cells, either a scrollbar column drawn by the engine (List) or rk-scroll-marks for a region that scrolls across. Stories that scroll get the classic-scrollbars tag. CONTRIBUTING's Adding a component has the interim wording.

## 2026-10-03

Written from what the components that landed actually do, with Button as the worked example: the files and the export lines, the .pure split and the server-component check, variants, glyphs, states and the forced-colours opt-out, scrolling (0208), metadata including the new knownIssues field (from #150), the Node snapshot test, stories (the named stories a reviewer expects, settled() per 0164, about four instances per story, the tag table with zoom written on each export, what runs after every story and its escape hatches), the known-failures table, the changeset, and 'Building a field' moved whole from CONTRIBUTING (0127), with a link left behind. Linked from CONTRIBUTING's Adding a component and from the component type's description in cairn.toml.

## 2026-10-03

Criterion 3 is left open, for a ruling. Every rule has a line naming the tests that prove it, but three are only partly proven by a test, and the recipe says so rather than claim otherwise: rule 3 (a glyph in an accessible name) is checked generally only for fields, by checkField; for anything else only by the stories' getByRole queries. Rule 4 (no hand-rolled key or focus logic) has no check that finds a hand-written listener. Rule 5's semantic-tokens-only half has no check that a component stylesheet reads only semantic tokens. Follow-ups proposed to the CTO. Criterion 2 waits on the first wave-3 component.

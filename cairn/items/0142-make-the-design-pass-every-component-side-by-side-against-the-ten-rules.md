---
id: 142
uid: 561d9fa4-c6f3-488c-b4e4-7b7f74223a51
title: 'Make the design pass: every component, side by side, against the ten rules'
type: chore
status: doing
milestone: primitives
assignee: Oddur Sigurdsson
claimed: 2026-10-09
depends_on:
- 34
- 35
- 36
- 37
- 38
- 39
- 40
- 41
- 42
- 43
- 44
- 55
- 57
- 64
- 98
- 101
- 102
- 123
- 124
- 125
- 129
- 130
- 131
- 132
- 133
- 135
- 136
- 137
- 138
- 139
- 140
created: 2026-10-03
updated: 2026-10-09
priority: p0
layer: components
effort: l
---

## Problem

Components written in parallel by different hands are individually correct
and collectively inconsistent: a slightly different padding here, a different
mark for the same state there, a danger red used two ways. The only way to
find that is to put everything on one screen and look, which is what the
kitchen-sink screen (0064) is for.

## Proposal

One reviewer, with the kitchen sink open, at every density, both modes, every
theme preset and both painters, goes through every component against the ten
rules, the state vocabulary (0118) and each other. Every finding is fixed here
or filed as a bug against the component, and this item lists them.

## Acceptance criteria

- [ ] Every component is checked against the ten rules, and the result is a table in this item: component × rule, with any exception and its reason
- [ ] Every state in the state vocabulary is drawn the same way in every component that has it, verified on the kitchen-sink screen
- [ ] Spacing inside and between controls is one of a small documented set of counts, and the set is written into the recipe (0134)
- [ ] Every finding is fixed or filed as a `bug` item linked here
- [ ] A repository-wide check fails if any component source contains a glyph literal or a pixel length
- [ ] Before-and-after screenshots of the kitchen sink at normal and touch density, light and dark, are attached to the pull request

---
id: 65
uid: e652b4eb-3a52-4395-8ad5-c52f74850c5b
title: Answer prefers-contrast with attributes, not a third palette
type: feature
status: backlog
milestone: primitives
depends_on:
- 117
- 118
created: 2026-09-22
updated: 2026-10-03
priority: p2
layer: tokens
effort: m
---

## Problem

`prefers-contrast: more` is a reader telling us the default is not enough. A
third palette is the pixel-system answer. On a character grid it is mostly
attribute work: heavier borders, no dim, bold where a pixel system would
darken.

## Proposal

A `contrast` context (`standard`, `more`) selected by `prefers-contrast: more`
and forcible with `data-contrast="more"`: borders draw heavy, dim becomes the
default foreground, muted text becomes default, the focus ring thickens, and
the text pairs are gated at 7:1.

## Acceptance criteria

- [ ] `prefers-contrast: more` and `data-contrast="more"` both apply it, in a story
- [ ] Every text pair passes 7:1 in the increased context, in both modes, in the contrast gate
- [ ] No geometry changes: conformance is identical with it on and off
- [ ] Disabled stays distinguishable from enabled without relying on dim

## 2026-10-03

Rewritten by the program plan: the pre-pivot template text is replaced with how this works on the grid, the criteria are one list (the template, plus the contracts from the plan, plus this item's own), and the dependencies point at the contracts it is built on.

---
id: 43
title: Tooltip
type: component
status: backlog
milestone: primitives
depends_on:
- 34
- 86
created: 2026-09-22
updated: 2026-09-22
priority: p1
layer: components
effort: m
---

## Purpose

What it is for, and what it is deliberately not for.

## Anatomy

Parts and slots, e.g. `<Select.Trigger>`, `<Select.Popover>`.

## States

The `data-*` attributes it exposes. These are public API.

## Tokens consumed

Semantic tokens only. A component that needs a reference token is a missing semantic.

## Accessibility

Role, keyboard map, focus behaviour, announcements.

## Acceptance criteria

- [ ] Built on the behaviour layer; no hand-rolled focus or keyboard logic
- [ ] Styled from `data-*` state and semantic tokens only
- [ ] Stories cover every state, and run as Vitest browser tests
- [ ] axe passes; keyboard walkthrough recorded in the story
- [ ] Light, dark and forced-colors verified
- [ ] Metadata written: props, anatomy, when to use, when not to

## 2026-09-22

## TUI criteria (added by the pivot, cairn 0076)

- [ ] Sized in cells, and drawn by the frame engine: no box characters written by hand
- [ ] Frame glyphs are `aria-hidden`; the accessible name never contains one
- [ ] Ships a text snapshot, which is its documentation as much as its test
- [ ] Operable by keyboard alone, and usable with a finger at touch density
- [ ] State reads without colour: an attribute or a mark carries it too
- [ ] Conforms at `strict`, or declares its exception with a reason

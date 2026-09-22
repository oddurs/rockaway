---
id: 38
title: Radio group
type: component
status: backlog
milestone: primitives
depends_on:
- 33
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

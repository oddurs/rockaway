---
id: 64
uid: 96e76a96-8e2d-4480-bf0e-3503ea0bd9ac
title: 'Build the kitchen-sink screen: every component, with the theme inputs as controls'
type: feature
status: doing
milestone: primitives
assignee: Oddur Sigurdsson
claimed: 2026-10-09
depends_on:
- 13
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
- 55
- 57
- 62
- 98
- 101
- 102
- 135
- 136
- 137
- 138
- 139
- 140
created: 2026-09-22
updated: 2026-10-09
priority: p1
layer: docs
effort: m
---

## Proposal

One screen, built only from the real components, that shows all of them at
once: the reference the design pass (0142) reviews against, and the screen the
site's landing page can reuse. It replaces the canvas's component sheet.

A 120 × 40 composition: panes (a tree, a table, tabs, a form of every field,
a list, a progress row, a status bar with key hints), with an open popover and
a menu in a second story, and a dialog over its backdrop in a third.

## Acceptance criteria

- [ ] One story renders every component, and a test fails if a component exported from `@rockaway/react` is not on it
- [ ] Theme preset, mode, density, border set, conformance level and painter are Storybook controls, and switch without a rebuild
- [ ] It passes conformance and continuity in every combination of the controls
- [ ] Its text snapshot is checked in, so any component change shows up as a diff of the whole screen

## 2026-10-03

Rewritten by the program plan: the pre-pivot template text is replaced with how this works on the grid, the criteria are one list (the template, plus the contracts from the plan, plus this item's own), and the dependencies point at the contracts it is built on.

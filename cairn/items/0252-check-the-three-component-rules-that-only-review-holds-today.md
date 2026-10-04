---
id: 252
uid: 12006095-2b7b-479a-abd0-7f23926e6a9a
title: Check the three component rules that only review holds today
type: chore
status: ready
milestone: v0.1
created: 2026-10-03
updated: 2026-10-03
priority: p2
layer: tooling
effort: m
---

## Purpose

The component recipe (0134) names three rules no test enforces: no glyph in an accessible name outside fields, no hand-written key or focus listener in a component, and no non-semantic token in a component stylesheet. Write a check for each, with a fixture that fails it. Proposed by polish-chrome in 0134.

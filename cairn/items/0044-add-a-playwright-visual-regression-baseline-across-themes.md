---
id: 44
uid: 1218df97-e494-4547-9244-916a8275e638
title: Add a Playwright visual-regression baseline across themes
type: chore
status: backlog
milestone: primitives
depends_on:
- 13
- 117
created: 2026-09-22
updated: 2026-10-03
priority: p1
layer: tooling
effort: m
---

## Problem

The concept's third test layer is screenshots, "because the half-stroke bug
proved 1 and 2 can both pass while the page is wrong". Text snapshots (0087)
check geometry, conformance checks boxes, and 0117's continuity check checks
that strokes meet. None checks the pixels of a palette, a stroke weight or an
attribute.

## Proposal

Pixel baselines for every story, through Vitest browser mode's screenshot
assertion (Playwright underneath), for the painters and the palettes rather
than for layout.

## Acceptance criteria

- [ ] Every story has baselines in light and dark, at normal and touch density, with both painters
- [ ] Baselines are produced in a pinned Linux container with the workbench font self-hosted, so they do not drift between machines; how to update them is in CONTRIBUTING
- [ ] A changed pixel fails CI with a diff image uploaded as an artifact
- [ ] Theme presets are covered by one story each, so a palette change shows up as pixels

## 2026-10-03

Rewritten by the program plan: the pre-pivot template text is replaced with how this works on the grid, the criteria are one list (the template, plus the contracts from the plan, plus this item's own), and the dependencies point at the contracts it is built on.

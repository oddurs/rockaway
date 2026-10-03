---
id: 125
uid: d60e49e2-c842-4c6a-9bf1-3779ce6a4203
title: Check every story at every density and in both modes
type: chore
status: backlog
milestone: primitives
depends_on:
- 88
- 117
created: 2026-10-03
updated: 2026-10-03
priority: p1
layer: tooling
effort: m
---

## Problem

The concept says conformance runs "at every density and in every theme". It
runs at whatever the toolbar says, and in CI that is `light` and `normal`
only. A component that is on the grid at `normal` and off it at `touch` passes
today.

## Proposal

The `afterEach` in `apps/workbench/.storybook/preview.tsx` already checks
conformance. Make it walk the matrix: for each of four densities and two
modes, set the root's attributes, wait for every screen to remeasure, and run
conformance and 0117's continuity check. Play functions run once; the
geometry is checked eight times.

## Acceptance criteria

- [ ] Conformance and continuity run at dense, normal, airy and touch, in light and dark, after every story
- [ ] A failure names the density and mode it failed at
- [ ] Every interactive element is at least 24px square at every density, and at least 44px tall at touch (WCAG 2.5.8, and the README's claim)
- [ ] A story can opt out of one cell of the matrix only with a reason, printed in the run
- [ ] CI time before and after is recorded here

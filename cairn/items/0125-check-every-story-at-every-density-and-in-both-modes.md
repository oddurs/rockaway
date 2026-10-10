---
id: 125
uid: d60e49e2-c842-4c6a-9bf1-3779ce6a4203
title: Check every story at every density and in both modes
type: chore
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 88
- 117
created: 2026-10-03
updated: 2026-10-09
closed_at: 2026-10-09
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

- [x] Conformance and continuity run at dense, normal, airy and touch, in light and dark, after every story
- [x] A failure names the density and mode it failed at
- [x] Every interactive element is at least 24px square at every density, and at least 44px tall at touch (WCAG 2.5.8, and the README's claim)
- [x] A story can opt out of one cell of the matrix only with a reason, printed in the run
- [x] CI time before and after is recorded here

## 2026-10-03

The walk lives in apps/workbench/.storybook/matrix.ts and runs after every story under the test runner. The play function runs once; then the root is switched through each cell the project's plan walks, the harness waits for every screen to settle (two still frames, every Screen-measured cell equal to its line box), and conformance, target size and continuity run there. Failures are collected across all cells and thrown once, each under 'at <density>, <mode>'. In the Storybook UI only the toolbar's own cell is checked. The context attribute names live only in .storybook/contexts.ts, so 0180's rename is one table.

## 2026-10-03

Matrix per project, chosen for CI time. storybook (sRGB): 4 densities x 2 modes; conformance and targets in all 8 cells; continuity 'across' (every density in the story's mode, every mode at its density: 5 screenshots, not 8, because density moves where a line falls and mode only its colour); axe again in the other mode at the story's density. p3: modes only (its geometry is storybook's), pixels once, axe in both modes. zoom and forced-colors: 4 densities in the story's own mode, pixels in each. testTimeout raised to 30s for the walk.

## 2026-10-03

What the matrix found (see the report): (1) Screen never remeasures on a context change, because its ResizeObserver watches only its own box, which a cell-sized screen sizes from its stale cell; a 1ch x 1lh probe fixes it (patch ready, lands after #88 per the CTO). (2) A one-row control is 32px at touch, not 44 (decision 0074); the CTO decided touch becomes 2.75. (3) List rows fail WCAG 2.5.8 at normal (20px, touching) and dense (16px); normal becomes 1.5, dense is documented as trading target size. (4) In dark mode a bare <button> keeps Chrome's ButtonFace (#6b6b6b) because the reset does not clear a control's background: 4.46:1. (5) With the probe applied, List's Disabled story sits 1px off the grid at dense after keyboard navigation (rows at y = 15, 31, 47px in 16px cells).

## 2026-10-03

Known failures are declared in .storybook/known.ts (approved by the CTO): each names the check, rule, cells, element, the reason and the ticket. Every one it excuses is printed in the run, and a reporter fails the run on any entry that was in play (its subject was on the page in a cell it covers) yet excused nothing, so an entry has to go when its ticket lands. Prose opts out of dense/airy/touch with a reason: its hand-built screen is measured by its own play function, which walks the densities itself.

## 2026-10-03

CI on the PR found one-row targets crowding each other beyond List: nav links at normal (Link Current) and a Button beside a List row (Glyphs, Themes) at normal and dense. Both are what the CTO's density decisions settle, so the normal and dense entries now cover every one-row target (normal-one-row, dense-one-row). A broad entry can go unused in a run of a few files, so the stale reporter fails only a run of the whole workbench and warns in a filtered one.

## 2026-10-03

CI time, same runner type. Before (main, run 37155846386): check job 2m12s, test step 1m24s. After (PR 99, run 37155899316): check job 2m40s, test step 1m53s. The matrix costs about 29s on the test step (+35%) and 28s on the job; the full run used all five known entries and found none stale. Expect the step to grow once the Screen probe lands, since cell-sized screens are then read in every cell instead of reported as stale.

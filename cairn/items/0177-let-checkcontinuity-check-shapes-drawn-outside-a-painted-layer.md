---
id: 177
uid: 01b26dca-479b-4f2e-8413-0635639a8ff9
title: Let checkContinuity check shapes drawn outside a painted layer
type: feature
status: done
milestone: site
assignee: Oddur Sigurdsson
depends_on:
- 117
- 143
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
priority: p2
layer: tooling
effort: s
---

## Problem

Prose rules (0143) draw with pseudo-elements, which have no box the continuity
check can find. A descriptor would let a caller say where a shape is.

## Acceptance criteria

- [x] `checkContinuity` accepts extra shapes (`{ element, shape, cells }`) and checks them like painted cells
- [x] The site's prose rules are checked with it

## 2026-10-03

Built on #151 and #180, both merged into this branch: a shape outside a layer goes through the same screenshot path, so #180 hides every other painted layer and #151 photographs it through its clip window and counts what is scrolled away as unseen. The per-layer loop now reads runs from a source: a painted layer's rows, or a descriptor { element, pseudo?, shape, cells?, name? } cut into whole cells of the element's box (negative col/row from the far edge). Ink comes from the pseudo-element's --rk-ink-colour, or its colour where that is currentColor.

## 2026-10-03

A pseudo-element's shape is photographed without its element's words (alone): at dense the y of Layout and the g of Spacing in the fixture's table header reach into the rule's row, the same thing #180 found for a screen's title (0245). Without it Prose/Lines failed at dense with a leak and a broken stroke in th::after.

## 2026-10-03

proseShapes(root) lists h1 (double rule), h2 and each thead th (rule), hr, and the blockquote gutter. It replaces the workbench's own prose-lines.ts checker, which only asked whether a line ran end to end. Each header cell is its own shape, so the step between two header cells' rules is not compared. The check runs in the Prose stories at every density, dark and forced colors, on the stylesheet and markup the site uses; it does not run on the built site's pages, whose test drives Chromium from Node and cannot load @rockaway/react/testing into the page without a bundle.

---
id: 182
uid: e1677a82-905e-439a-88b0-07e25faefe20
title: Mark controls and panes so the conformance levels can see them
type: feature
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 123
created: 2026-10-03
updated: 2026-10-04
closed_at: 2026-10-04
priority: p1
layer: components
effort: s
---

## Problem

0123 gives `standard` half a cell inside `[data-rk-control]` and checks only
panes at `loose` (`[data-rk-pane]`), but no component sets either attribute, so
both rules touch test cases only.

## Acceptance criteria

- [x] Every control sets `data-rk-control` and every pane-like container sets `data-rk-pane`, and the metadata says which
- [x] A story per level shows a real component held to it
- [x] The recipe (0134) says when a component is a control or a pane

## 2026-10-04

Controls: Button (its button), Link (its a), Checkbox (its row, so the description and error sit outside), TextField (its box). Panes: Frame, Callout, Fieldset/FieldFrame (on their Screen), List (rk-list), Tree, Table (rk-table), the overlay surface. Neither, each with its reason in NEITHER in metadata.test.ts: Badge, Divider, Form, KeyHint, Keymap; the test fails a component that is none of the three, and a listed one that has since been marked. The extractor reads the marks from the attributes the source writes, so the metadata (grid.is) cannot drift from the DOM.

## 2026-10-04

Grid/Conformance gains Real components: strict, standard and loose, on one page of a Frame holding a Button, a Checkbox, a Badge and a List. Standard moves the button label half a cell (passes, being in a control; fails at strict) and the badge mark the same (fails, not a control). Loose adds a box of any size inside the frame (passes) and puts the list pane a few pixels off whole cells (fails).

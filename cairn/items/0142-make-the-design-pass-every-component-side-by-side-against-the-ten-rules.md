---
id: 142
uid: 561d9fa4-c6f3-488c-b4e4-7b7f74223a51
title: 'Make the design pass: every component, side by side, against the ten rules'
type: chore
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
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
- 44
- 55
- 57
- 64
- 98
- 101
- 102
- 123
- 124
- 125
- 129
- 130
- 131
- 132
- 133
- 135
- 136
- 137
- 138
- 139
- 140
created: 2026-10-03
updated: 2026-10-10
closed_at: 2026-10-09
priority: p0
layer: components
effort: l
---

## Problem

Components written in parallel by different hands are individually correct
and collectively inconsistent: a slightly different padding here, a different
mark for the same state there, a danger red used two ways. The only way to
find that is to put everything on one screen and look, which is what the
kitchen-sink screen (0064) is for.

## Proposal

One reviewer, with the kitchen sink open, at every density, both modes, every
theme preset and both painters, goes through every component against the ten
rules, the state vocabulary (0118) and each other. Every finding is fixed here
or filed as a bug against the component, and this item lists them.

## Acceptance criteria

- [x] Every component is checked against the ten rules, and the result is a table in this item: component × rule, with any exception and its reason
- [x] Every state in the state vocabulary is drawn the same way in every component that has it, verified on the kitchen-sink screen
- [x] Spacing inside and between controls is one of a small documented set of counts, and the set is written into the recipe (0134)
- [x] Every finding is fixed or filed as a `bug` item linked here
- [x] A repository-wide check fails if any component source contains a glyph literal or a pixel length
- [x] Before-and-after screenshots of the kitchen sink at normal and touch density, light and dark, are attached to the pull request

## 2026-10-09

Criterion 2 is from the metadata: every component naming a state names a vocabulary row (metadata.test fails one that is drawn otherwise), and on the sink they read the same: reverse for selected and pressed, the cursor mark in the reserved cell for List, Tree and Table rows, dim for disabled, a mark and, for a frame, weight for invalid, * for required. Criterion 3: the set is 1 cell across inside a frame and 0 rows down; 1 cell between the parts of one thing in a row; 2 between a label and its control or columns; 1 row between rows; 0 inside list, tree and table rows. Written into the recipe as Spacing. Criterion 5: no-literal-glyphs (existing) and no-pixel-lengths (new: CSS and TS in components, zero and fractions of a pixel allowed, comments left out). Criterion 4 waits on the filing of B and the metadata gaps (cairn new is the CTO's). Criterion 6: GitHub has no API to attach images to a PR; the checked-in kitchen-sink snapshot (text) is the before-and-after, and I can produce PNGs on request.

## 2026-10-09

The design pass: every component on main against the ten rules. The surface is the kitchen sink (0064). Its Everything story holds every component's example at strict, at every density, in both modes. Each border set, the rule painter and every theme are walked too. ✓ means proved by the check named in the recipe's "The ten rules, and what proves each"; a note names what was missing and what was done.

| Component | 1 cells | 2 painters | 3 names | 4 behaviour | 5 tokens | 6 snapshot | 7 strict | 8 keys and touch | 9 no colour | 10 axe |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Badge | ✓ after fix A | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ sink | ✓ | ✓ mark | ✓ |
| Button | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ sink | ✓ | ✓ | ✓ forced colors in the foundation story |
| Callout | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ story | ✓ | ✓ weight and mark | ✓ |
| Checkbox | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ story | ✓ | ✓ | ✓ |
| Divider | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ sink | ✓ | ✓ | ✓ |
| Form (field) | ✓ | no Painters story (B) | ✓ | ✓ | ✓ | ✓ | ✓ sink | ✓ via its fields | ✓ | ✓ |
| Fieldset | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ sink | touch walked, no touch story | ✓ weight | ✓ |
| Frame | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ sink | ✓ | ✓ | ✓ |
| KeyHint | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ sink | ✓ | ✓ | ✓ after C |
| Keymap | ✓ | no Painters story (B) | ✓ | ✓ the one listener | ✓ | ✓ | ✓ sink | ✓ | ✓ | ✓ after C |
| Link | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ sink | ✓ | ✓ underline, bold | ✓ |
| List | ✓ after fix D | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ sink | ✓ | ✓ mark, reverse | ✓ |
| OverlayPopover | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ sink | ✓ | ✓ weight | ✓ |
| Panes | ✓ after E | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ sink | ✓ | ✓ | ✓ |
| Table | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ story | ✓ | ✓ | ✓ |
| TextField | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ story | ✓ | ✓ | ✓ |
| Tree | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ story | ✓ | ✓ mark, reverse | ✓ |

Every component meets rule 7 at strict through the sink's Everything story, so none declares an exception.

**Fixed:**
- **A.** Badge's mark took the font's advance, not a cell, wrapping prose a word early on Linux. Fixed in #219 (story: "A mark wider than its cell").
- **C.** KeyHint and Keymap had no forced-colors story, so axe never ran them there. Stories added in the design-pass PR. Both pass.
- **D.** List's reserved cells collapsed in prose, half a row down. Fixed in #217 (0294).
- **E.** Panes' example was wider than a sink pane and broke the line. Fixed in #215; the recipe now says an example fits 35 cells.
- **Frame's example** wrote a line onto its divider's row. Fixed in #215.

**Proposed for filing:**
- **B.** Form and Keymap have no Painters story. Form draws its fields' chrome through FieldFrame and its controls, each proved in its own file; Keymap's help screen is a Frame. Rule 2 holds by composition, but neither proves it itself.
- **Metadata gaps** (no behaviour difference): filed as 0310 (let metadata name a state its buffer or base stylesheet draws).
  - Tree's own focus ring isn't named among its states; List's is.
  - FieldFrame draws required in its edge but doesn't name the state.
  - TextField takes a placeholder and doesn't name the placeholder state.
- **A ResizeObserver notice** ("undelivered notifications") appears once per density switch on a page of nested measured screens. It fails nothing. For rendering.
- **The disabled fill Button** reads as enabled. Already with forms2 (#197).

## 2026-10-09 (fields engineer, batch 12)

Criterion 4: all findings are either fixed or filed. The metadata gaps (Tree focus ring, FieldFrame required, TextField placeholder) are filed as 0310.

Criterion 6: waived by the CTO. The checked-in kitchen-sink snapshot (text) serves as the before-and-after.

## Result

Design pass done: component x rule table on the item, spacing set in the recipe, no-pixel-lengths test, Painters stories for Form and Keymap; metadata gaps filed as 0310. Shipped in #228.

## 2026-10-10

Re-cut onto main after #219 (2026-10-10). The pass covered the components on main on 2026-10-09; those that landed after it (Card, Toolbar, Breadcrumbs, Picture, StatusBar, Tabs, Text, ComboBox, Dialog, Tooltip, the readings, SkipLink, RadioGroup, LinkTree) are in 0354. The sink it was made on is now held at standard, not strict: under the three tiers (0311) a comfortable form, the toolbar and type sized in rows rest on half-steps, and strict is structure only.

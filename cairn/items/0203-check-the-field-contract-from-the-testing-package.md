---
id: 203
uid: d3cd9fbf-f3e4-4dfd-a695-6ede9b8b4dd8
title: Check the field contract from the testing package
type: feature
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 127
created: 2026-10-03
updated: 2026-10-10
closed_at: 2026-10-10
priority: p1
layer: tooling
effort: s
---

## Problem

A field author must pass `isRequired` to `Label` by hand (0127): React Aria puts
required in no context a label can read. Forgetting it is the field contract's
one remaining footgun.

## Acceptance criteria

- [x] `checkField(root)` in `@rockaway/react/testing` asserts the required mark matches `aria-required`, the description and error are in `aria-describedby`, no name holds a glyph, and no live region is used
- [x] Every field component's stories run it

## 2026-10-03

Claimed past 0127, which is merged and in review with one criterion open until the field family lands; the parts this checks are on main.

## 2026-10-03

checkField(root) in packages/react/src/testing/field.ts, with expectField and formatFields. It finds every .rk-field, its label (inline .rk-label or a frame's hidden .rk-field-frame-label) and the controls that label names. Required is the root's data-required (React Aria writes it from isRequired) or aria-required/required on a control; the inline mark must be drawn exactly then, and for a framed field the painted top edge must hold the words followed by the theme's required mark. A checkbox group's state stops saying required once something is checked, so the root's data-required, not the controls, is the truth for groups.

## 2026-10-03

Criterion 2 is met structurally: .storybook/preview.tsx runs expectField once (semantics, not cells, so not per density) after every story with a .rk-field on the page, with the theme's glyphs; parameters.fields = false turns it off for a story that breaks the contract on purpose. Grid/Field check has one story per failure: forgotten isRequired, a mark on a field not required, a frame with no mark in its edge, an unlinked description, a glyph in a name, a live region. Form and Fieldset's stories pass it.

## 2026-10-10

On main: expectField in packages/react/src/testing/field.ts, run after every story with a field. Closed from review.

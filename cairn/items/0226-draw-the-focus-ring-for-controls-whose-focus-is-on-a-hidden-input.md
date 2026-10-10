---
id: 226
uid: d892796c-24ea-49d0-9a2b-7f849de68604
title: Draw the focus ring for controls whose focus is on a hidden input
type: feature
status: review
milestone: primitives
assignee: Oddur Sigurdsson
claimed: 2026-10-04
created: 2026-10-03
updated: 2026-10-09
priority: p2
layer: css
effort: s
---

## Problem

`focus.css` draws on `:focus-visible`, but Switch, Checkbox and Radio focus a
visually hidden input, so each re-declares the ring on `[data-focus-visible]`.

## Acceptance criteria

- [ ] One global rule draws the ring from `[data-focus-visible]` on a control whose focus is a hidden input, and the per-component copies go

## 2026-10-04

Rule, in focus.css: label[data-focus-visible]:has(input:is([type=checkbox], [type=radio])) gets the ring. React Aria's Switch, Checkbox and Radio render a label root it marks data-focus-visible, round the visually hidden native input the keyboard focuses. A text field's label wraps nothing and is not marked; a native label round a native checkbox is never marked, and the checkbox wears its own ring; a list row is not a label. Story Foundations/Focus and motion, Focus in a hidden input, uses React Aria's own controls (ours are on #114, #119, #123): tab to each, the focus is the hidden input and the label wears 2px solid at 2px offset; a text field's label and group get none; a click gives none. Passes in Chromium, WebKit and Firefox (:has). The per-component copies are on those three open PRs (switch.css .rk-switch-button, checkbox.css .rk-checkbox-row, radio-group.css .rk-radio-button): each drops its rule when this lands, and the criterion is ticked then.

## 2026-10-09

Checkbox (#119) landed with its own copy of the ring on .rk-checkbox-row; this branch removes it, and Checkbox's Keyboard story still finds a solid ring on the focused row, from the global rule. Switch (#114) and Radio (#123) carry the other two copies and drop them when they rebase onto this.

---
id: 226
uid: d892796c-24ea-49d0-9a2b-7f849de68604
title: Draw the focus ring for controls whose focus is on a hidden input
type: feature
status: backlog
milestone: primitives
created: 2026-10-03
updated: 2026-10-03
priority: p2
layer: css
effort: s
---

## Problem

`focus.css` draws on `:focus-visible`, but Switch, Checkbox and Radio focus a
visually hidden input, so each re-declares the ring on `[data-focus-visible]`.

## Acceptance criteria

- [ ] One global rule draws the ring from `[data-focus-visible]` on a control whose focus is a hidden input, and the per-component copies go

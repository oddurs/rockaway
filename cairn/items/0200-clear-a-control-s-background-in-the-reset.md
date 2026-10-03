---
id: 200
uid: a7e484e6-8eb8-44ba-87a1-6533d24d4711
title: Clear a control's background in the reset
type: bug
status: done
milestone: primitives
assignee: Oddur Sigurdsson
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
priority: p1
layer: css
effort: s
---

## What happens

`reset.css` clears a control's padding, border and colour but not its background,
so in dark mode a bare `<button>` keeps Chrome's `ButtonFace` (#6b6b6b) and its
text measures 4.46:1. Found by the density matrix (0125).

## Acceptance criteria

- [x] `button`, `input`, `select` and `textarea` start with `background: none` in the reset
- [x] The `dark-button-face` known-failures entry is removed

## 2026-10-03

background: none joins padding, border and colour in the reset's control rule. Measured before: a bare button in dark mode was #eaebed on Chrome's ButtonFace #6b6b6b, 4.46:1 (axe). Rhythm, Matrix and Screenshot stories, which hold bare buttons, pass axe in both modes in the storybook and p3 projects without the dark-button-face entry; the full run in CI is the check that no other story leant on a control's UA background.

## Result

reset.css clears a control's background; the dark-button-face known failure is gone

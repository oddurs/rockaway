---
id: 200
uid: a7e484e6-8eb8-44ba-87a1-6533d24d4711
title: Clear a control's background in the reset
type: bug
status: backlog
milestone: primitives
created: 2026-10-03
updated: 2026-10-03
priority: p1
layer: css
effort: s
---

## What happens

`reset.css` clears a control's padding, border and colour but not its background,
so in dark mode a bare `<button>` keeps Chrome's `ButtonFace` (#6b6b6b) and its
text measures 4.46:1. Found by the density matrix (0125).

## Acceptance criteria

- [ ] `button`, `input`, `select` and `textarea` start with `background: none` in the reset
- [ ] The `dark-button-face` known-failures entry is removed

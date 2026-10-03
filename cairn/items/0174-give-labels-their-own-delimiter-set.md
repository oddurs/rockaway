---
id: 174
uid: 794d636e-377e-47e1-b44c-020ed4468520
title: Give labels their own delimiter set
type: chore
status: backlog
milestone: later
depends_on:
- 139
created: 2026-10-03
updated: 2026-10-03
priority: p3
layer: tokens
effort: s
---

## Problem

Badge borrows `glyph.delimiter.control`, the only delimiter set a theme has. A
theme that wants a label drawn differently from a control (`‹beta›`) cannot.

## Acceptance criteria

- [ ] `glyph.delimiter.label` exists, defaults to the control delimiters, and Badge reads it

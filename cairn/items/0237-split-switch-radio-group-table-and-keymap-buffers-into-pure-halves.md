---
id: 237
uid: c3e63307-5815-4db6-ab8c-61093622cfa7
title: Split Switch, Radio group, Table and Keymap buffers into pure halves
type: chore
status: doing
milestone: primitives
assignee: Oddur Sigurdsson
claimed: 2026-10-03
created: 2026-10-03
updated: 2026-10-03
priority: p3
layer: components
effort: s
---

## Purpose

switchBuffer, radioGroupBuffer, tableBuffer and keymapHelpBuffer still live in 'use client' files, so a server cannot call them without crossing the client boundary that 0126 set out. Move each into its component's .pure.ts and export it from the same entry. In progress as #146.

## 2026-10-03

In #146: Keymap (engine and keymapHelpBuffer into keymap.pure.ts) and Table (layout, chrome, fitCell, marks, tableBuffer into table.pure.ts) are done, each exported from its entry's pure line and called on the server by the server-component check. Switch and Radio group follow as #114 and #123 land.

---
id: 237
uid: c3e63307-5815-4db6-ab8c-61093622cfa7
title: Split Switch, Radio group, Table and Keymap buffers into pure halves
type: chore
status: ready
milestone: primitives
created: 2026-10-03
updated: 2026-10-03
priority: p3
layer: components
effort: s
---

## Purpose

switchBuffer, radioGroupBuffer, tableBuffer and keymapHelpBuffer still live in 'use client' files, so a server cannot call them without crossing the client boundary that 0126 set out. Move each into its component's .pure.ts and export it from the same entry. In progress as #146.

---
id: 231
uid: e3e393ff-9672-44d6-8b70-68a1d1df7aa6
title: Use the theme's ellipsis in the DOM
type: feature
status: backlog
milestone: primitives
depends_on:
- 119
created: 2026-10-03
updated: 2026-10-03
priority: p3
layer: components
effort: s
---

## Problem

Tree, List and Link cut text with CSS `text-overflow: ellipsis`, which draws the
font's `…` even under an ASCII theme.

## Acceptance criteria

- [ ] Every cut in the DOM uses the theme's ellipsis, and an ASCII story proves no `…` appears

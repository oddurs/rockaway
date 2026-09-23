---
id: 65
title: Add an increased-contrast context
type: feature
status: backlog
milestone: later
depends_on:
- 62
created: 2026-09-22
updated: 2026-09-22
priority: p3
layer: tokens
effort: m
---

## Proposal

A third resolver modifier, `contrast` (standard, increased), wired to
`prefers-contrast: more`. The canvas shows it as a build option; it should be a
context like mode.

## 2026-09-22

Increased contrast on a character grid is mostly attribute work: bold plus reverse rather than a third palette, which is worth testing before committing to a context.

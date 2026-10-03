---
id: 195
uid: be55151f-8075-49d4-b71b-c8ad4e4ee28c
title: Lint data-rk-offgrid reasons in source
type: chore
status: backlog
milestone: later
depends_on:
- 123
created: 2026-10-03
updated: 2026-10-03
priority: p2
layer: tooling
effort: s
---

## Problem

0072 asks for a lint rule. The run-time check catches an empty reason only in a
story that renders it.

## Acceptance criteria

- [ ] An empty or missing reason fails in any source file, not only in a rendered story

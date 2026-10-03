---
id: 202
uid: f1089592-b76d-4f4e-8c43-1757ff103d81
title: Move Button's forced-colors opt-out into its own stylesheet
type: chore
status: backlog
milestone: primitives
depends_on:
- 131
- 181
created: 2026-10-03
updated: 2026-10-03
priority: p3
layer: css
effort: s
---

## Problem

Button's backplate opt-out sits in `forced-colors.css` only because Button was
being polished in parallel (0181). Its own stylesheet should own it.

## Acceptance criteria

- [ ] The rule lives in `button.css`, or every component uses one shared marker

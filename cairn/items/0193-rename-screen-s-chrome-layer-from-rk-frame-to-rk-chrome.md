---
id: 193
uid: a0729d32-44fb-4870-8b76-ac6c462f6e27
title: Rename Screen's chrome layer from rk-frame to rk-chrome
type: chore
status: backlog
milestone: primitives
created: 2026-10-03
updated: 2026-10-03
priority: p3
layer: components
effort: s
---

## Problem

Every screen writes `rk-frame` for its chrome layer, so Frame's own root has to
be `rk-frame-box`. `rk-chrome` says what it is.

## Acceptance criteria

- [ ] The layer is `rk-chrome`, Frame's root is `rk-frame`, and nothing else changes

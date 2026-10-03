---
id: 201
uid: ea1fb999-916b-4d99-9b6d-c52d50ddcce2
title: Check that every reversing rule opts out of the forced-colors backplate
type: chore
status: backlog
milestone: primitives
depends_on:
- 181
created: 2026-10-03
updated: 2026-10-03
priority: p2
layer: tooling
effort: s
---

## Problem

In forced colors Chromium paints a Canvas backplate behind text unless the
element opts out, so reverse video vanishes (0181). The opt-out list in
`forced-colors.css` is kept by hand; the next component that reverses
something will silently disappear.

## Acceptance criteria

- [ ] A Node test finds every component rule that swaps figure and ground or reads the inverse pair, and fails if the opt-out does not cover it

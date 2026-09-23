---
id: 27
title: Support forced-colors mode from the start
type: feature
status: done
milestone: runtime
assignee: Oddur Sigurdsson
depends_on:
- 24
created: 2026-09-22
updated: 2026-09-22
priority: p1
layer: css
effort: s
---

## Problem

## Proposal

## Acceptance criteria

- [x] Semantic tokens remap to the CSS system colours, so components need no rules of their own
- [x] Surfaces keep a visible edge where tone or shadow carried them
- [x] Shadows collapse, because they are not painted
- [x] Verified in a browser actually running in forced-colors mode

## 2026-09-22

The remapping lives in `rk.base`, not `rk.tokens`: the generated token file is in `rk.tokens` too, so which won would have depended on import order. Testing runs the story in a second Vitest browser project launched with Playwright's `forcedColors: 'active'`; the Storybook plugin owns `include` but merges `exclude`, so the two projects are split by excluding each other's files rather than by tags (the plugin's tag filter had no effect here).

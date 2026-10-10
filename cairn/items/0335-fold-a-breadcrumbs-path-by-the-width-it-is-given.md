---
id: 335
uid: 15301ad7-0d61-4e7a-bce6-de9e46f3a631
title: Fold a Breadcrumbs path by the width it is given
type: feature
status: backlog
milestone: primitives
created: 2026-10-10
updated: 2026-10-10
priority: p3
layer: components
effort: s
---

## Purpose

Breadcrumbs folds its middle at a fixed `maxItems` (0319). Like Toolbar (0318), it should also fold by the width it is given: the first level and as many of the last as fit, the middle in the ellipsis's menu.

## Acceptance criteria

- [ ] With no `maxItems`, a path too long for its row folds the fewest middle levels that let it fit.
- [ ] `foldPath` gains the width rule, and the text model matches the page at every density.

---
id: 24
title: Fix the cascade layer order
type: feature
status: backlog
milestone: runtime
depends_on:
- 9
created: 2026-09-22
updated: 2026-09-22
priority: p0
layer: css
effort: s
---

## Proposal

`@layer reset, tokens, base, components, utilities, overrides;` declared once,
first. Consumers' unlayered CSS beats everything, which is the point.

## Acceptance criteria

- [ ] Order declared in one file that every entry point imports first
- [ ] A consumer can override any component style without `!important`

## 2026-09-22

The layer statement already exists in packages/css/src/index.css (from the scaffold). What is left here is the override test in the acceptance criteria.

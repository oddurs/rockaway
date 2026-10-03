---
id: e6ee56dd-75d9-4e6c-8a3b-2c1b3654a64e
title: Fix the cascade layer order
type: feature
status: done
milestone: runtime
assignee: Oddur Sigurdsson
depends_on:
- 49f84d7f-dcce-4638-b4c6-03786870da1c
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

- [x] Order declared in one file that every entry point imports first
- [x] A consumer can override any component style without `!important`

## 2026-09-22

The layer statement already exists in packages/css/src/index.css (from the scaffold). What is left here is the override test in the acceptance criteria.

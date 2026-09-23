---
id: 28
title: Register animatable tokens with @property
type: feature
status: done
milestone: runtime
assignee: Oddur Sigurdsson
depends_on:
- 20
created: 2026-09-22
updated: 2026-09-22
priority: p2
layer: css
effort: s
---

## Problem

## Proposal

## Acceptance criteria

- [x] Reference tokens are registered with a real syntax and an initial value
- [x] Aliased semantic tokens stay untyped, so environment overrides still land
- [x] An invalid value is rejected rather than breaking every rule that reads the token

## 2026-09-22

Terrazzo's propertyDefinitions does the right thing by itself: reference tokens get a typed syntax with an initial value, and anything that is an alias is registered as `*`. That matters, because forced colors overrides semantic tokens with keywords like `Canvas` and `none`, which a typed registration would reject. One visible consequence: computed values are now canonical, so `--rk-motion-duration-base` reads back as `0.2s` rather than `200ms`. The tests were updated to match.

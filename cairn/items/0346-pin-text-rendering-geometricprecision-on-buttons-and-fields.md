---
id: 346
uid: be79ff8b-e14d-418b-873f-06a85a15f327
title: 'Pin text-rendering: geometricPrecision on buttons and fields'
type: chore
status: backlog
milestone: v0.1
created: 2026-10-10
updated: 2026-10-10
priority: p3
layer: css
---

A test that holds `text-rendering: geometricPrecision` on buttons and fields, so a future reset cannot bring back the 10px rounding.

## Acceptance criteria

- [ ] A CSS test fails if a button or field loses geometricPrecision

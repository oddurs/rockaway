---
id: 204
uid: cefc7740-913a-404f-bc70-6c4df603a26f
title: Verify FieldFrame inside NumberField and DateField
type: chore
status: backlog
milestone: primitives
depends_on:
- 127
created: 2026-10-03
updated: 2026-10-03
priority: p2
layer: components
effort: s
---

## Problem

Those components provide React Aria's `GroupContext`, which `FieldFrame`'s `Group`
would merge in. Verify it when Select and NumberField are built.

## Acceptance criteria

- [ ] A story frames a NumberField and a DateField with `FieldFrame`, and state attributes come through once

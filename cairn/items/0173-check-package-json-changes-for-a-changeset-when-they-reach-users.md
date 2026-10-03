---
id: 173
uid: db0be16c-4f0c-4551-8930-e6b69915a710
title: Check package.json changes for a changeset when they reach users
type: chore
status: backlog
milestone: v0.1
depends_on:
- 162
created: 2026-10-03
updated: 2026-10-03
priority: p3
layer: distribution
effort: s
---

## Problem

The changeset check (0162) looks at `src` and `files`. A change to `exports`,
`dependencies`, `peerDependencies` or `sideEffects` reaches users and passes.

## Acceptance criteria

- [ ] The check diffs the published fields of each package.json against the base and requires a changeset when they change

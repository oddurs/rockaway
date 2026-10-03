---
id: 173
uid: db0be16c-4f0c-4551-8930-e6b69915a710
title: Check package.json changes for a changeset when they reach users
type: chore
status: done
milestone: v0.1
assignee: Oddur Sigurdsson
depends_on:
- 162
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
priority: p3
layer: distribution
effort: s
---

## Problem

The changeset check (0162) looks at `src` and `files`. A change to `exports`,
`dependencies`, `peerDependencies` or `sideEffects` reaches users and passes.

## Acceptance criteria

- [x] The check diffs the published fields of each package.json against the base and requires a changeset when they change

## 2026-10-03

scripts/check-changeset.ts now diffs each changed package.json against the merge base, field by field with isDeepStrictEqual, over the fields that reach an install. Those are name, type, exports, main, module, types, bin, files, sideEffects, dependencies, peerDependencies, peerDependenciesMeta, optionalDependencies, engines and publishConfig. Left out: scripts, devDependencies and version, which the release writes itself. A package new on the branch counts every published field as changed. The failure names the fields. Tried on grid's package.json: a devDependency or a script passes with no changeset; a dependency, sideEffects or an export each fails, naming the field.

## Result

The changeset check also diffs each package.json's published fields (exports, dependencies, peerDependencies, sideEffects, files, engines, publishConfig and the like) against the base, and requires a changeset when one changes.

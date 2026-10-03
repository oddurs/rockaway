---
id: 122
uid: 4a91895a-6d6a-414f-916a-1958bf6ab639
title: Give each component one line in the barrels, so parallel work merges cleanly
type: chore
status: backlog
milestone: primitives
depends_on:
- 33
- 121
created: 2026-10-03
updated: 2026-10-03
priority: p1
layer: tooling
effort: s
---

## Problem

Every component branch adds to `packages/react/src/index.ts` (a block of named
exports per component today) and `packages/css/src/index.css` (an `@import`
line). With fifteen components in flight at once, these two files are where
every branch collides.

## Proposal

- `index.ts`: one statement per component file, sorted by path, on one line
  where the formatter allows (`export * from './components/button.tsx';`, or a
  single named-export line if Biome's `noReExportAll` objects). Types and
  values exported by a component file are that file's business.
- `index.css`: one `@import` line per component, sorted, under a comment that
  says component order does not matter because components never share a
  selector.
- Add `merge=union` for both files in `.gitattributes`, so a local rebase of
  two branches that each added a line resolves itself. The resolution is still
  checked: Biome sorts, and the build fails on a duplicate.

## Acceptance criteria

- [ ] Every component contributes exactly one line to `index.ts` and one to `index.css`
- [ ] A test fails if a component file under `components/` is missing from either barrel, or appears twice
- [ ] `.gitattributes` unions both files, and CONTRIBUTING says how to resolve the rare conflict that remains
- [ ] The public API is unchanged: the built `index.d.ts` exports the same names before and after

---
id: 122
uid: 4a91895a-6d6a-414f-916a-1958bf6ab639
title: Give each component one line in the barrels, so parallel work merges cleanly
type: chore
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 33
- 121
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
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

- [x] Every component contributes exactly one line to `index.ts` and one to `index.css`
- [x] A test fails if a component file under `components/` is missing from either barrel, or appears twice
- [x] `.gitattributes` unions both files, and CONTRIBUTING says how to resolve the rare conflict that remains
- [x] The public API is unchanged: the built `index.d.ts` exports the same names before and after

## 2026-10-03

Added criterion (from the CTO): CI fails when a shipped module needs the client but does not begin with 'use client'. scripts/check-packages.ts reads every .js in each tarball and flags one that imports a React hook, imports React Aria, or passes an on* handler without the directive. Checked by stripping it from dist/components/key-hint.js: the step fails naming the file. It covers every module, not only dist/components, so screen.js is held to it too.

## 2026-10-03

Named exports, one line each, rather than export *. #62 exports buttonVariants from button.tsx for 0047's metadata and deliberately keeps it out of the barrel; export * would have made it public, breaking criterion 4, and would do the same for anything a later component exports for its tests or .meta.ts. Biome's lineWidth is 320 for src/index.ts only, so every statement stays on one line and organizeImports still sorts them by path.

## 2026-10-03

Public API checked with TypeScript 5.6's checker (the copy attw brings, since TypeScript 7 has no JS API) over dist/index.d.ts before and after: the same 52 names, values and types. Frame and Divider have no stylesheet, so the CSS barrel test is per stylesheet under css/src/components, and the TS one per .tsx under react/src/components; metadata, tests or stories beside them are ignored. The barrel test lives in packages/react because the CSS package has no test runner. Simulated a union merge that doubled frame.tsx and dropped list.tsx: the test fails naming both.

## Result

Each component is one named-export line in packages/react/src/index.ts and one @import in packages/css/src/index.css, both merge=union. packages/react/test/barrels.test.ts fails on a missing, doubled or (CSS) unsorted line. check-packages.ts fails any shipped module that uses hooks, React Aria or on* handlers without 'use client'.

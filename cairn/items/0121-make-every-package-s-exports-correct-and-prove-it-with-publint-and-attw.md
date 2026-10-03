---
id: 121
uid: 1c4aeb9a-ca5c-4462-8d8f-44fe4209598d
title: Make every package's exports correct, and prove it with publint and attw
type: chore
status: backlog
milestone: primitives
depends_on:
- 12
created: 2026-10-03
updated: 2026-10-03
priority: p0
layer: distribution
effort: m
---

## Problem

The packages have never been consumed from outside the workspace, and it
shows:

- `@rockaway/react` maps `./testing` to `./dist/index.js`, the main bundle,
  and `./paint` to `./dist/paint.js`, which tsdown does not emit under that
  name from three entries all called `index.ts`.
- No export has a `types` condition.
- The testing helpers (`checkConformance`, `screenshot`) are re-exported from
  the main entry, so every consumer bundles test code.
- Components use hooks and carry no `'use client'`, so importing one from a
  React Server Component fails.
- The workspace resolves through the `@rockaway/source` condition, so none of
  this has ever been exercised.

The site (0103) is meant to import the packages "the way a consumer would",
and the quickstart (0155) will install them from tarballs. Both need this
first.

## Acceptance criteria

- [ ] `publint` and `@arethetypeswrong/cli` pass for all four packages, in CI, on every pull request
- [ ] Every entry resolves to the file that was built for it, with a `types` condition, for both `import` and bundler resolution
- [ ] The testing helpers are exported from `@rockaway/react/testing` only, and the main entry no longer pulls them in
- [ ] Component entries carry `'use client'`, and a fixture imports `Frame` from a server component without error
- [ ] `pnpm pack` contents are listed in CI for each package, and contain no tests, stories or sources outside `files`
- [ ] A changeset records the moved testing export

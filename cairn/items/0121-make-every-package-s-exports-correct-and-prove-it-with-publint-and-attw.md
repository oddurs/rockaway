---
id: 121
uid: 1c4aeb9a-ca5c-4462-8d8f-44fe4209598d
title: Make every package's exports correct, and prove it with publint and attw
type: chore
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 12
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
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

- [x] `publint` and `@arethetypeswrong/cli` pass for all four packages, in CI, on every pull request
- [x] Every entry resolves to the file that was built for it, with a `types` condition, for both `import` and bundler resolution
- [x] The testing helpers are exported from `@rockaway/react/testing` only, and the main entry no longer pulls them in
- [x] Component entries carry `'use client'`, and a fixture imports `Frame` from a server component without error
- [x] `pnpm pack` contents are listed in CI for each package, and contain no tests, stories or sources outside `files`
- [x] A changeset records the moved testing export

## 2026-10-03

Exports: the workspace map keeps @rockaway/source first, then types, then default; publishConfig.exports carries the same map without the source condition, which pnpm pack/publish substitutes. scripts/check-packages.ts fails if the two drift, if a subpath's types are not the .d.ts beside its .js, or if two subpaths resolve to one file (publint and attw both pass that, which is how ./testing pointed at the main bundle).

## 2026-10-03

react builds with tsdown unbundle: one output module per source module. Bundling drops 'use client' when it merges modules; unbundled, each component file keeps its directive in dist. Rolldown's MODULE_LEVEL_DIRECTIVE warning is filtered in tsdown and in the Storybook build, where the directive is meaningless.

## 2026-10-03

attw runs with --profile esm-only (node10 and require() of ESM are out of scope) and excludes .css entrypoints, which are not modules TypeScript resolves. The server-component fixture (packages/react/test/server-component/render.ts) runs Flight under --conditions=react-server with React's own node-loader; with the directive removed from list.js it fails importing useContext via react-aria, and from frame.js it renders Frame as server markup and the assertion fails.

## 2026-10-03

Watch: 'use client' makes every export of a component module a client reference, so frameBuffer, dividerBuffer, drawRule, formatKeys and the like cannot be called from a server component while they live in the component's file. Splitting the pure buffer functions into their own modules would fix that.

## Result

Exports carry @rockaway/source, types, default; publishConfig.exports is the same map without the source condition. Testing helpers only at @rockaway/react/testing. Components are 'use client' and react builds unbundled. pnpm packages:check (CI) packs every package, lists it, runs publint --strict and attw --profile esm-only on the tarball, and renders Frame from a server component.

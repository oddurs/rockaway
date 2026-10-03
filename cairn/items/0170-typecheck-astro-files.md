---
id: 170
uid: 99eeb659-16ad-480f-a25c-af07b1c1537e
title: Typecheck .astro files
type: chore
status: done
milestone: site
assignee: Oddur Sigurdsson
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
priority: p2
layer: tooling
effort: s
---

## Problem

`@astrojs/check` supports TypeScript 5 and 6, not 7, so `.astro` frontmatter is
not typechecked. The site keeps its logic in `src/lib` meanwhile.

## Acceptance criteria

- [x] `astro check` runs in `pnpm check`, pinned to a TypeScript it supports if need be
- [x] It passes, and a deliberate type error in a page fails it

## 2026-10-03

@astrojs/check 0.9.10 declares typescript ^5 || ^6 as a peer and resolves it with require.resolve('typescript'), so in this workspace it always gets 7. Neither packageExtensions nor overrides moves a peer that resolves from the workspace root. A TypeScript 6 as a direct site dependency, even aliased, links its tsc into the site's .bin and moves the site's own tsc to 6. So: the site depends on @astrojs/language-server, the checker astro check runs, directly. packageExtensions gives the language server a typescript-6 alias of its own, so nothing on any path changes. scripts/check-astro.ts constructs AstroCheck with that copy. Astro's own CLI points at @astrojs/ts-content-mapper for TypeScript 7.1+; when the repository reaches 7.1, that is the way off 6.

## 2026-10-03

It runs in the site's build, after tsc, because the site checks against the packages' published declarations, which only exist after they build. So pnpm check and CI run it through pnpm build, with no workflow change. pnpm --filter site check:astro runs it alone. Result: 19 files (the four .astro files and the site's TypeScript), 0 errors. With const rows: number = 'five' in index.astro's frontmatter it reports ts(2322) at index.astro:10:7 and exits 1; restored, exit 0.

## Result

The site's build typechecks its .astro files with Astro's language server (scripts/check-astro.ts), on a TypeScript 6 given to the language server alone, so the rest stays on 7. It runs in pnpm check via pnpm build, and a deliberate type error in a page fails it.

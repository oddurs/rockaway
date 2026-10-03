---
id: 170
uid: 99eeb659-16ad-480f-a25c-af07b1c1537e
title: Typecheck .astro files
type: chore
status: backlog
milestone: site
created: 2026-10-03
updated: 2026-10-03
priority: p2
layer: tooling
effort: s
---

## Problem

`@astrojs/check` supports TypeScript 5 and 6, not 7, so `.astro` frontmatter is
not typechecked. The site keeps its logic in `src/lib` meanwhile.

## Acceptance criteria

- [ ] `astro check` runs in `pnpm check`, pinned to a TypeScript it supports if need be
- [ ] It passes, and a deliberate type error in a page fails it

---
id: 12
title: 'Scaffold the monorepo: pnpm workspaces, tsdown, Changesets, Biome'
type: chore
status: done
milestone: foundations
assignee: Oddur Sigurdsson
created: 2026-09-22
updated: 2026-09-22
priority: p0
layer: tooling
effort: m
---

## Acceptance criteria

- [x] pnpm workspace with `packages/tokens`, `packages/css`, `packages/react`
- [x] Libraries build with tsdown, ESM only, with type declarations
- [x] Changesets configured for independent package versions
- [x] Biome (or oxlint) for lint and format
- [x] `git init` and `cairn init --git` so cairn can merge item files

---
id: 20
title: Compile tokens to CSS custom properties with Terrazzo
type: feature
status: backlog
milestone: tokens
depends_on:
- 15
- 17
created: 2026-09-22
updated: 2026-09-22
priority: p0
layer: tokens
effort: m
---

## Acceptance criteria

- [ ] `packages/tokens` emits `tokens.css` inside `@layer tokens`
- [ ] A typed TS map of token names, for linting and autocompletion
- [ ] Build is deterministic; output is diffable in review

---
id: 20
title: Compile tokens to CSS custom properties with Terrazzo
type: feature
status: done
milestone: tokens
assignee: Oddur Sigurdsson
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

- [x] `packages/tokens` emits `tokens.css` inside `@layer tokens`
- [x] A typed TS map of token names, for linting and autocompletion
- [x] Build is deterministic; output is diffable in review

## 2026-09-22

Criterion 1 predates the prefix rename (0016): the layer is `rk.tokens`. The CSS is committed at css/tokens.css (exported as @rockaway/tokens/tokens.css) and the name map at src/names.ts; a test rebuilds both into a temporary directory and fails on any difference. This item builds the default contexts (light, regular); 0021 adds the dark and density blocks.

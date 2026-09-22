---
id: 9
title: 'Choose the styling approach: plain CSS, @layer and data attributes'
type: decision
status: done
milestone: foundations
assignee: Oddur Sigurdsson
created: 2026-09-22
updated: 2026-09-22
priority: p0
layer: css
effort: s
---

## Context

The published CSS is the one artifact every consumer can use, so it should
depend on nothing.

## Options

- **Plain CSS / CSS Modules in cascade layers, keyed off `data-*` state** — zero runtime, framework-free, legible in DevTools
- **vanilla-extract** — typed theme contracts, at the cost of the file split
- **Panda** — config-first and atomic, with codegen in the repo
- **StyleX** — built for Meta's scale; its constraints only pay off there

## Decision

**Plain CSS in cascade layers, styled from `data-*` state**, decided 2026-09-22.

- Component styles live in `packages/css/src/components/*.css`, not beside the React components. The CSS package is the contract, so it cannot depend on the React package's layout
- Stable, namespaced class names (`.ds-button`, `.ds-button__icon`): no CSS Modules hashing, because consumers must be able to read and override selectors
- State comes from the behaviour layer's attributes (`[data-pressed]`, `[data-focus-visible]`, `[data-disabled]`); variants are `data-variant` / `data-size`
- Everything ships inside `@layer ds.components` (and the other `ds.*` layers), so any unlayered consumer CSS wins without `!important`
- Components read semantic tokens only: `var(--ds-*)`

## Consequences

- Zero runtime, no build step for consumers, legible in DevTools
- No type checking of class names. Mitigated by the React package being the only producer of them, and by stories covering every variant
- Tailwind v4 becomes an adapter generated from tokens, not the authoring language

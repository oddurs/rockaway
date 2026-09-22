---
id: 7
title: 'Choose the framework target: React only, or several'
type: decision
status: done
milestone: foundations
assignee: Oddur Sigurdsson
created: 2026-09-22
updated: 2026-09-22
priority: p0
layer: behaviour
effort: s
---

## Context

Decides the behaviour layer outright. React only opens React Aria Components and
Base UI; several frameworks points to Zag.js / Ark UI.

## Options

- **React only** — the deepest headless libraries, one set of bindings
- **Several (Zag.js / Ark UI)** — state machines shared across React, Vue, Solid, Svelte
- **Web Components (Lit)** — rejected as the primary layer: SSR, forms and a11y across shadow DOM are still painful

## Decision

**React only**, decided 2026-09-22.

Only the behaviour layer is React. Tokens (DTCG + CSS custom properties) and
the CSS package are framework-free, so a Vue or Svelte app can still take the
whole visual system and pair it with its own headless library. What React-only
buys is the two deepest headless libraries available, and one set of bindings
to keep correct.

## Consequences

- `packages/react` is the only framework package. Nothing in `packages/tokens` or `packages/css` may import React
- Component CSS must be written against `data-*` state and class names, never against a React API, so it stays portable
- Revisit when a second framework has a real consumer, not before. Zag.js / Ark UI is the route if so

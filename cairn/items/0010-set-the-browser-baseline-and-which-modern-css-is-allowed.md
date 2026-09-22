---
id: 10
title: Set the browser baseline and which modern CSS is allowed
type: decision
status: done
milestone: foundations
assignee: Oddur Sigurdsson
created: 2026-09-22
updated: 2026-09-22
priority: p1
layer: css
effort: s
---

## Context

Allowed: `@layer`, `@property`, container queries, `light-dark()`, relative
colour syntax, `contrast-color()` (supported everywhere since April 2026).

Not yet: `@function` and `if()` are Chromium-only. Progressive enhancement at most.

## Decision

**Floor: Baseline 2024**, decided 2026-09-22. As a browserslist query,
`baseline 2024`, which today resolves to Chrome/Edge 130, Firefox 132 and
Safari/iOS 18.2.

Allowed without a fallback, because every browser in the floor has them:

- `@layer`, `@property`, container queries (size and style), `:has()`
- `light-dark()` with `color-scheme`, OKLCH, relative colour syntax, `color-mix()`
- `@starting-style`, `transition-behavior: allow-discrete`, `:focus-visible`, nesting

Allowed as progressive enhancement only, behind `@supports`, with a working
baseline underneath:

- `contrast-color()` (Baseline 2026), `@scope`, anchor positioning, `field-sizing`

Not allowed yet: `@function` and `if()` are Chromium-only.

## Consequences

- The browserslist query lives in the root `package.json` and drives Vite, Lightning CSS and any lint that reads it
- Relative colour syntax means hover and active states come from one token, not three
- Reviewed each January, when a new Baseline year lands

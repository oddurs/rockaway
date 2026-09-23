---
id: 66
title: The font shorthand with a var() breaks minifiers
type: bug
status: done
milestone: runtime
assignee: Oddur Sigurdsson
created: 2026-09-22
updated: 2026-09-22
priority: p0
layer: css
effort: s
---

## What happens

`font: var(--rk-text-body)` is legal CSS, and it works in a browser, but
Lightning CSS refuses to parse it:

```
SyntaxError: [lightningcss minify] Unexpected token Function("var")
```

so `pnpm --filter workbench build` fails, and so would any consumer minifying
with Lightning CSS (Vite's default) or an older minifier.

The tests did not catch it because Vitest runs the stories unminified.

## What should happen

The published CSS survives minification.

## Reproduction

1. `pnpm --filter workbench build`

## Acceptance criteria

- [x] No `font` shorthand with a var() value anywhere in the shipped CSS or the workbench
- [x] A production build of the workbench runs in CI, so a minifier sees the CSS

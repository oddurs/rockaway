---
id: 61
title: 'Specify the focus ring: 2px gap, 2px accent'
type: decision
status: backlog
milestone: runtime
created: 2026-09-22
updated: 2026-09-22
priority: p1
layer: css
effort: s
---

## Decision

One focus treatment everywhere: `box-shadow: 0 0 0 2px var(--rk-surface), 0 0 0 4px var(--rk-border-focus)`,
shown on `:focus-visible` only. Invalid fields use a 3px tinted halo in the
danger tone instead of a second ring.

## Consequences

Forced-colors mode swaps the ring for `outline: 2px solid CanvasText`. Components
never define their own focus style.

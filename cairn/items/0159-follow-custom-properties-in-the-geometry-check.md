---
id: 159
uid: 60b382cd-ca83-4be5-aaf1-2de6e293b2a0
title: Follow custom properties in the geometry check
type: chore
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 32
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
priority: p2
layer: tooling
effort: s
---

## Problem

The geometry check (0032) fails any variant or state rule that sets a size,
padding, margin or inset. A rule can still set a custom property — say
`--rk-x-pad` — that a base rule uses for padding, and the check will not see it.

## Acceptance criteria

- [x] The check traces `var()` in every geometric declaration back to the custom properties variant and state rules set, and fails on those too
- [x] A fixture proves it: a state rule that changes padding through a custom property fails
- [x] Declared exceptions still work and are still listed in the snapshot

## 2026-10-03

The check now finds every custom property that ends up in a geometric declaration (read by one, or set into a property that is, transitively) across all component stylesheets together, since a property can be set in one sheet and read in another, and holds variant and state rules that set one to the same rule, exceptions included. The design tokens a geometric property is set from become geometric too, which is right: a state rule that set --rk-x-2 would change a size. No stylesheet on main sets a geometric property under a state, so the exceptions snapshot is unchanged (empty). Test-only, so no changeset.

## Result

variant-geometry.test follows var(): custom properties read by a size, padding, margin or inset (transitively, across stylesheets) are geometric, and a variant or state rule that sets one fails unless it declares an exception, which is listed as before. Fixtures prove the direct case, the transitive one, the cross-sheet one, and that a colour property does not count.

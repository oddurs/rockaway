---
id: 32
uid: 710ebab1-aeaa-4c49-a2cf-3e679dad42fd
title: Write the typed variant helper
type: feature
status: backlog
milestone: primitives
depends_on:
- 76
created: 2026-09-22
updated: 2026-10-03
priority: p0
layer: components
effort: s
---

## Problem

Button declares `ButtonVariant` and `ButtonSize` as hand-written unions and
writes `data-variant` and `data-size` by hand. Every component after it will
do the same, the metadata (0047) will have to restate the allowed values, and
nothing will stop a variant from changing geometry.

On the grid a variant is an attribute: it changes the border set, the
attribute and the palette role, never a radius or a shadow (0076). And it is a
`data-*` attribute, never a class name, because the CSS reads state and
nothing else.

## Proposal

`defineVariants({ variant: ['default', 'fill', 'quiet', 'danger'], size: ['md',
'lg'] }, { variant: 'default', size: 'md' })` returns the inferred prop types,
the defaults, a `dataAttributes(props)` function that writes `data-variant`
and friends (defaults included, so CSS can select them), and the value lists
the metadata reads. Button adopts it in its polish (0131). No class names, no styles, no runtime dependencies.

## Acceptance criteria

- [ ] Prop types are inferred from the definition; no component hand-writes a variant union
- [ ] It emits `data-*` attributes only, with defaults written out, covered by unit tests
- [ ] The metadata schema (0047) reads each component's variant values from it
- [ ] A check fails if a CSS rule keyed on a `data-*` variant other than `size` sets a width, height, padding, margin or inset: variants do not change geometry

## 2026-10-03

Rewritten by the program plan: the pre-pivot template text is replaced with how this works on the grid, the criteria are one list (the template, plus the contracts from the plan, plus this item's own), and the dependencies point at the contracts it is built on.

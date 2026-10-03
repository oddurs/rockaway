---
id: 32
uid: 710ebab1-aeaa-4c49-a2cf-3e679dad42fd
title: Write the typed variant helper
type: feature
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 76
created: 2026-09-22
updated: 2026-10-03
closed_at: 2026-10-03
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

- [x] Prop types are inferred from the definition; no component hand-writes a variant union
- [x] It emits `data-*` attributes only, with defaults written out, covered by unit tests
- [x] The metadata schema (0047) reads each component's variant values from it
- [x] A check fails if a CSS rule keyed on a `data-*` variant other than `size` sets a width, height, padding, margin or inset: variants do not change geometry

## 2026-10-03

Rewritten by the program plan: the pre-pivot template text is replaced with how this works on the grid, the criteria are one list (the template, plus the contracts from the plan, plus this item's own), and the dependencies point at the contracts it is built on.

## 2026-10-03

Built as defineVariants(values, defaults) in packages/react/src/variants.ts, returning values, defaults, select() and dataAttributes(). isolatedDeclarations forces one extra line: an exported value made by a call must spell its type, so a component writes 'const VARIANTS = {...} as const' and 'export const buttonVariants: Variants<typeof VARIANTS> = defineVariants(VARIANTS, {...})'. 'as const satisfies' was tried and is refused under isolatedDeclarations. Variant names are one lowercase word (prop name = attribute suffix) and may not take a state's name from 0118 (hovered, pressed, selected, disabled, ...) or density/motion/attrs; both refused at the type and at module load. An undeclared value at runtime is drawn as the default rather than written through, so the CSS only ever sees a value it has a rule for.

## 2026-10-03

The geometry check (packages/react/test/variant-geometry.test.ts) covers every data-* attribute except size, so it enforces 0118's 'states never change geometry' as well as the variant rule. It reads each component stylesheet with postcss (a new devDependency of @rockaway/react) and flags width/height/inline-size/block-size (and min/max), padding, margin, inset and top/right/bottom/left. A rule that must break it declares '/* geometry exception: <why> */' directly above the declaration, and the declared exceptions are an inline snapshot, so adding one is a visible diff. Known gap: a variant can still set a custom property that a base rule uses for geometry; the check does not follow var() references.

## 2026-10-03

Button's quiet variant is the one declared exception: it zeroes the label's padding-inline because it drops its delimiters. Left as it is to keep Button's behaviour unchanged; 0131 should decide whether quiet stays a variant or the air keys off the delimiters' presence. Criterion 3 is left unticked: it is true only once 0047 reads buttonVariants.values, and 0047 depends on this item. buttonVariants is exported from button.tsx (not the package barrel) for 0047 to read.

## 2026-10-03

Criterion 3 is true with 0047: button.meta.ts publishes Button's variants through describeVariants(buttonVariants, ...), which takes the names, values and default from the helper and only adds words, keyed by the helper's values. Button's variant and size props in the metadata are typed from buttonVariants.values too. Closed in 0047's pull request.

## Result

defineVariants(values, defaults) in packages/react/src/variants.ts; a component exports xVariants: Variants<typeof VARIANTS>, writes data-* with xVariants.dataAttributes(), and its metadata reads the values with describeVariants(xVariants, ...).

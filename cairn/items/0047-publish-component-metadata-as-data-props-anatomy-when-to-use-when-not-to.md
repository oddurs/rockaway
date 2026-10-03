---
id: 47
uid: 7f329bd1-d9fc-44c9-ae6e-678cd7131d61
title: 'Publish component metadata as data: props, anatomy, when to use, when not to'
type: feature
status: review
milestone: primitives
assignee: Oddur Sigurdsson
claimed: 2026-10-03
depends_on:
- 32
- 76
created: 2026-09-22
updated: 2026-10-03
priority: p0
layer: docs
effort: m
---

## Problem

Coding agents are now a large share of the system's users. Documentation that
exists only as prose serves one audience. And every component item carries
"Metadata written: props, anatomy, when to use, when not to", which five
shipped components have ticked while no metadata exists anywhere in the
repository.

## Proposal

A schema, defined once, that every component fills in beside its source
(`components/<name>.meta.ts`, typed by a `defineMeta()` helper):

- name, summary, purpose, when to use, when not to
- anatomy: the parts as they are imported
- props: generated from the TypeScript source where the toolchain allows (note
  that TypeScript 7's compiler API may not be available to a generator; record
  the approach chosen here), hand-written where it does not
- variants: read from the variant helper (0032)
- states: the `data-*` attributes and the state-vocabulary row each uses (0118)
- keyboard map, and what is announced
- tokens consumed: extracted from the component's CSS, not typed by hand
- size in cells (minimum and default), and the conformance level it holds
- the text snapshot: the path of the checked-in snapshot, which is what an
  agent needs to lay a screen out without rendering it

The build aggregates them into one `meta.json` exported by `@rockaway/react`.
The site (component pages, 0147) and the agent surfaces (0048) both read it.

## Acceptance criteria

- [x] The schema exists as a type and a JSON Schema, and a test validates every component's metadata against it
- [x] Tokens consumed are extracted from CSS, and variant values from the variant helper, not restated
- [x] A test fails if a component exported from `@rockaway/react` has no metadata
- [x] `@rockaway/react/meta.json` is built and exported
- [ ] The recipe (0134) says how to write a component's metadata

## 2026-10-03

Rewritten by the program plan: the pre-pivot template text is replaced with how this works on the grid, the criteria are one list (the template, plus the contracts from the plan, plus this item's own), and the dependencies point at the contracts it is built on.

## 2026-10-03

Built as: components/<name>.meta.ts per component, typed by defineMeta() (part names inferred from the anatomy, so a state on a part that does not exist is a type error; states typed as the 0118 row names; variants via describeVariants(helper, words), keyed by the helper's values so a missing or extra value is a type error). src/metadata/index.ts assembles them with the generated parts into ComponentMeta and exports components, metadata and stateVocabulary from @rockaway/react/metadata. The build writes dist/meta.json from the built entry and validates it with ajv against src/metadata/meta.schema.json (copied to dist). Exports: ./metadata (typed JS), ./meta.json, ./meta.schema.json, in 0121's pattern, publint and attw clean.

## 2026-10-03

Props: read from the syntax with oxc-parser, not the TypeScript 7 compiler API, which is native and only offered as unstable. isolatedDeclarations makes the syntax enough. scripts/extract.ts folds in interfaces extended from the same file, names the rest under inherits, takes defaults from the component's destructuring (resolving a top-level constant), spells out literal-union aliases (Orientation, Platform), and the assembly overlays variant props with the helper's values and default. Tokens: every var(--rk-*) read by a rule selecting one of the component's classes, plus var() strings in its painters (local non-component imports are followed, other components are not), kept when declared by @rockaway/tokens or in the rk.tokens layer; the focus ring's tokens are added to components with focus-unframed. Both go to the committed src/metadata/extracted.ts (excluded from Biome, like names.ts); test/metadata.test.ts fails when it is stale (pnpm --filter @rockaway/react metadata).

## 2026-10-03

The test renders each component with react-dom/server and reads its stylesheets: an imported part must be exported, an element part's class must be written by the source, a role must be rendered, every variant value must reach its data-* attribute, a state must be read by a rule of its stylesheet (or, for the global focus ring, the component must be focusable), every state attribute its CSS reads must be named, any other data-* it reads must be a variant, keys must be chords KeyHint can draw, related components must have metadata. A second block feeds it broken copies of Button and Frame to prove each check fails. Screen is the one exported component without metadata, listed with its reason. Not done: size in cells and conformance level (no strictness levels exist yet), and List's snapshot is its scrollbar only, because there is no pure function for a whole List. Criterion 5 waits for 0134, which depends on this item.

## 2026-10-03

Rebased over Link (0135) and motion ticks (0120). Link has link.meta.ts; useTick and GlyphProvider are listed as not components. Link's stylesheet selects [data-current], which React Aria writes from aria-current, so the vocabulary's current row now lists both selectors.

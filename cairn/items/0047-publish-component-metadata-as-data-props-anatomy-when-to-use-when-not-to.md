---
id: 47
uid: 7f329bd1-d9fc-44c9-ae6e-678cd7131d61
title: 'Publish component metadata as data: props, anatomy, when to use, when not to'
type: feature
status: backlog
milestone: primitives
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

- [ ] The schema exists as a type and a JSON Schema, and a test validates every component's metadata against it
- [ ] Tokens consumed are extracted from CSS, and variant values from the variant helper, not restated
- [ ] A test fails if a component exported from `@rockaway/react` has no metadata
- [ ] `@rockaway/react/meta.json` is built and exported
- [ ] The recipe (0134) says how to write a component's metadata

## 2026-10-03

Rewritten by the program plan: the pre-pivot template text is replaced with how this works on the grid, the criteria are one list (the template, plus the contracts from the plan, plus this item's own), and the dependencies point at the contracts it is built on.

---
id: 147
uid: c5ee5aaa-8795-4d69-bfe6-a78604d615b5
title: Document every component on its own page, generated from its metadata
type: feature
status: backlog
milestone: site
depends_on:
- 47
- 104
- 138
- 144
created: 2026-10-03
updated: 2026-10-03
priority: p0
layer: site
effort: l
---

## Problem

Every component item says "ships a text snapshot, which is its documentation
as much as its test" and "metadata written". Nothing turns either into a page.
A component page that is written by hand drifts from the component the day
after it is written.

## Proposal

One page per component at `/components/<name>`, generated from the metadata
(0047), with prose written alongside it in Markdown for what cannot be
generated. Each page has, in this order:

1. The one-line purpose, and the text snapshot in a `CodeBlock.Snapshot`
   (0138) — the first thing on the page is the component as text.
2. A live example (an island), followed by its source.
3. When to use it, and when not to.
4. Anatomy, with parts named as they are imported.
5. Variants and states: one live row per state, each with its `data-*`
   attribute.
6. Props, generated.
7. Keyboard map, and what a screen reader announces.
8. Tokens consumed, linked to the token reference.
9. Size in cells, and the conformance level it holds.

## Acceptance criteria

- [ ] Every component in `@rockaway/react` has a page, and a build check fails if one is missing
- [ ] Props, states, keyboard map and tokens come from the metadata, not from hand-written tables
- [ ] Every live example also renders as its snapshot with JavaScript disabled
- [ ] Every page passes axe, conformance and continuity in the built site
- [ ] Every page can be copied as text (0105)

---
id: 147
uid: c5ee5aaa-8795-4d69-bfe6-a78604d615b5
title: Document every component on its own page, generated from its metadata
type: feature
status: review
milestone: site
assignee: Oddur Sigurdsson
claimed: 2026-10-03
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

- [x] Every component in `@rockaway/react` has a page, and a build check fails if one is missing
- [x] Props, states, keyboard map and tokens come from the metadata, not from hand-written tables
- [ ] Every live example also renders as its snapshot with JavaScript disabled
- [x] Every page passes axe, conformance and continuity in the built site
- [ ] Every page can be copied as text (0105)

## 2026-10-03

A page per component at /components/<slug>/, generated from @rockaway/react/meta.json (the JSON, so no component module is imported to build a page). In the proposal's order: summary; the snapshots, painted as rowRuns() markup with no script, by the same Painted component the foundations use (it becomes CodeBlock's snapshot when 0138 lands, a one-file change); the description; a live example and its source; when to use and when not, with links to the instead component; anatomy; variants; states, each with its selectors, how it is drawn and what carries it without colour; props per imported part, plus what it inherits; the keyboard map with keys drawn by formatKeys and spoken by spokenKeys; the name, what a reader hears and the notes; tokens, each linked to its row in the token reference (rows now have ids); related. Only the example is written by hand: src/islands/examples/<slug>.tsx, one module per island, and an MDX file that hydrates it and shows its source. Form and Fieldset sketch their fields from React Aria, because Text field and Radio group are not built yet; the MDX says so.

## 2026-10-03

Checks. getStaticPaths fails the build if a component in the metadata has no MDX, or an MDX names a component the metadata does not have; the react package's own test already fails on an exported component without metadata. The site test opens every component page at both bases, hydrates every island, then runs axe (WCAG 2.2 AA tags) and the published checkConformance and checkContinuity from @rockaway/react/testing in the page, loaded from the installed package (test/checks.ts serves it under /__rk/, and Playwright takes continuity's screenshots through a binding). With JavaScript off, every page shows every snapshot, painted, reading back as exactly the metadata's text. Continuity found one real seam: Divider's 'Every border set' snapshot stacked joined rules with no row between them, so their tees met. Fixed in divider.meta.ts, with a patch changeset.

## 2026-10-03

Not ticked: (3) a live example renders as its snapshot without JavaScript. The page shows the snapshots without JavaScript, but an example built on Screen (Frame, Divider, List) has no chrome until the client paints it; server-painted chrome is 0126 (#88). Once that lands, the examples need nothing more. (5) Copy as text (0105): every snapshot copies as its text by selection, but the copy button 0105 describes does not exist yet. Also not on the pages: size in cells and conformance level, because the metadata schema has no field for them (0047's proposal named them). Live rows per state, which would need a way to render a component in a state without interacting with it.

---
id: 140
uid: 8f661d1f-0f14-44af-be7f-95d695e66f56
title: Callout
type: component
status: backlog
milestone: primitives
depends_on:
- 118
- 129
created: 2026-10-03
updated: 2026-10-03
priority: p2
layer: components
effort: s
---

## Purpose

A framed note, tip or warning inside prose: what GitHub renders for
`> [!NOTE]`. The site's Markdown turns those blocks into this. Not a toast and
not a dialog.

## Anatomy

`<Callout tone title>`: a Frame with the tone's mark and title in the top edge, and prose inside.

## States

`data-tone`: `note`, `tip`, `warning`, `danger`.

## Tokens consumed

`border.*` and `fg.*` for the tone; `bg.surface`.

## Accessibility

`role="note"` (or an `aside` with a name from the title). The tone is in the
title text, so it is heard, and the mark beside it is `aria-hidden`.

## Acceptance criteria

- [ ] Built on the behaviour layer; no hand-rolled focus or keyboard logic
- [ ] Styled from `data-*` state and semantic tokens only
- [ ] Stories cover every state, and run as Vitest browser tests
- [ ] axe passes; keyboard walkthrough recorded in the story
- [ ] Light, dark and forced-colors verified
- [ ] Metadata written: props, anatomy, when to use, when not to
- [ ] Sized in cells, and drawn by the frame engine: no box characters written by hand
- [ ] Both painters render it identically, measured in cells
- [ ] Frame glyphs are `aria-hidden`; the accessible name never contains one
- [ ] Ships a text snapshot, which is its documentation as much as its test
- [ ] Operable by keyboard alone, and usable with a finger at touch density
- [ ] State reads without colour: an attribute or a mark carries it too
- [ ] Conforms at `strict`, or declares its exception with a reason
- [ ] Draws every state from the state vocabulary (0118), and no state changes its size in cells
- [ ] Reads its glyphs from the theme (0119): no box-drawing, block or mark literal in its source
- [ ] Rendered by the cell renderer (0117): continuity passes at all four densities
- [ ] One export line in `packages/react/src/index.ts` and one import line in `packages/css/src/index.css`, as 0122 sets out
- [ ] Tone is carried by border weight and a mark as well as colour
- [ ] `> [!NOTE]`, `[!TIP]`, `[!WARNING]` and `[!CAUTION]` in the site's Markdown render as callouts

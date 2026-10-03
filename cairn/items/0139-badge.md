---
id: 139
uid: 3c9825f7-b830-4060-b8b4-0edeac238130
title: Badge
type: component
status: backlog
milestone: primitives
depends_on:
- 32
- 118
created: 2026-10-03
updated: 2026-10-03
priority: p2
layer: components
effort: s
---

## Purpose

A short status label: `[beta]`, `✓ passing`, `✗ failing`, `3 new`. The site
uses it for each component's status. Not interactive, and not a tag input.

## Anatomy

`<Badge tone>`: delimiters or a mark, then text, on one row.

## States

`data-tone`: `neutral`, `accent`, `success`, `warning`, `danger`.

## Tokens consumed

`fg.*` and `bg.*-subtle` for the tone; `border.*` for delimiters.

## Accessibility

Plain text in the accessibility tree; the mark is `aria-hidden` and the tone
is said in words when it matters (the text is "failing", not only `✗`).

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
- [ ] Every tone carries a mark or a word as well as a colour, shown in a greyscale story

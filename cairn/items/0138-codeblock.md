---
id: 138
uid: 62f768be-a0b6-4c61-82f9-47ed25cf3efe
title: CodeBlock
type: component
status: backlog
milestone: primitives
depends_on:
- 118
- 129
created: 2026-10-03
updated: 2026-10-03
priority: p1
layer: components
effort: m
---

## Purpose

Code and text snapshots on a page: framed, titled, copyable, and on the grid.
The site shows every component's text snapshot in one of these, so a snapshot
has to render through the cell renderer, not the font, or its lines will not
meet at three densities out of four (0116). Not an editor, and not a
terminal emulator.

## Anatomy

`<CodeBlock title lang lines>`: a Frame whose title is the file name or
language, an optional line-number gutter separated by a rule that joins the
frame (`┬` / `┴`), the code in a real `<pre><code>`, and a copy button in the
top edge. `<CodeBlock.Snapshot>` takes a text snapshot, parses it back into a
buffer (`fromText`, using the inverted junction table from 0079) and paints it
through the cell renderer.

## States

`data-copied` briefly after a copy; `data-wrap` when wrapping is on.

## Tokens consumed

`bg.surface`, `fg.default`, `border.default`, and the syntax roles from 0144
when highlighted.

## Accessibility

The code is real text: selectable, findable, read by a screen reader. A
snapshot block is a `figure` whose `pre` has `role="img"` and an
`aria-label` describing what it shows, so its box characters are not read one
by one. The copy button names what it copies and announces "Copied".

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
- [ ] A snapshot shown through `CodeBlock.Snapshot` passes continuity at all four densities, where the same text in a plain `pre` does not
- [ ] `fromText` round-trips every snapshot in the repository: text to buffer to text is unchanged
- [ ] Long lines scroll horizontally in whole cells, declared as an exception with a reason; nothing else on the page scrolls sideways
- [ ] Copy works by keyboard and announces once

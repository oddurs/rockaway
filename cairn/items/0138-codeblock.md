---
id: 138
uid: 62f768be-a0b6-4c61-82f9-47ed25cf3efe
title: CodeBlock
type: component
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 118
- 129
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
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

`<CodeBlock code tokens lang title lineNumbers copyable label cols>` and
`<CodeSnapshot text label title copyable cols>`. `CodeSnapshot` is a sibling
export, as `ListItem` is, because `isolatedDeclarations` refuses
`CodeBlock.Snapshot`.

- A block is a `Screen` as tall as its code plus two rows. `codeBlockBuffer`
  paints the frame, the title in the top edge, and, with `lineNumbers`, a rule
  that joins the frame (`┬`/`┴`) with the numbers behind it. It also leaves a
  gap in the top edge for the copy button.
- The code is a real `<pre><code>` positioned in whole cells over the frame.
  `tokens` (one line of `{ text, role }` per line, from a highlighter) give
  each token its `rk-syntax-<role>` class from 0144. They are ignored if they
  do not join to `code`.
- Box drawing in code is split out by `shapeRuns` (in `@rockaway/grid`) into cell boxes the renderer
  strokes. The character stays, transparent, so a copy is exact. This is the
  function the site's Markdown pipeline should use too.
- A long line scrolls sideways inside the block. A ruler of one snap point per
  cell makes it come to rest on whole cells, and the `<code>` declares the
  in-motion fractions as an exception with its reason.
- `CodeSnapshot` reads a text snapshot back into cells (`fromText`), sets it
  inside the same frame (`snapshotBuffer`) and paints it.
- `codeBlockText` draws a whole block as text, code included, for the snapshot
  test.

## States

`data-copied` on the copy slot for two seconds after a copy. The button says
Done instead of Copy in the same four cells, so the state is in the word and
nothing moves. The copy button takes the focus ring (`focus-unframed`).
`data-wrap` was not built: wrapping code in whole cells needs the engine's
wrap and the page's to agree line for line, which is a ticket of its own.

## Tokens consumed

`border.default` for the frame and rule, `fg.default` for the title and code,
`fg.muted` for line numbers, and `syntax.*` through `.rk-syntax-<role>`. The
block has no ground of its own.

## Accessibility

The code is real text: selectable, findable, read by a screen reader. A
snapshot block is a `figure` whose `pre` has `role="img"` and an
`aria-label` describing what it shows, so its box characters are not read one
by one. The copy button names what it copies and announces "Copied".

## Acceptance criteria

- [x] Built on the behaviour layer; no hand-rolled focus or keyboard logic
- [x] Styled from `data-*` state and semantic tokens only
- [x] Stories cover every state, and run as Vitest browser tests
- [x] axe passes; keyboard walkthrough recorded in the story
- [x] Light, dark and forced-colors verified
- [x] Metadata written: props, anatomy, when to use, when not to
- [x] Sized in cells, and drawn by the frame engine: no box characters written by hand
- [x] Both painters render it identically, measured in cells
- [x] Frame glyphs are `aria-hidden`; the accessible name never contains one
- [x] Ships a text snapshot, which is its documentation as much as its test
- [x] Operable by keyboard alone, and usable with a finger at touch density
- [x] State reads without colour: an attribute or a mark carries it too
- [x] Conforms at `strict`, or declares its exception with a reason
- [x] Draws every state from the state vocabulary (0118), and no state changes its size in cells
- [x] Reads its glyphs from the theme (0119): no box-drawing, block or mark literal in its source
- [x] Rendered by the cell renderer (0117): continuity passes at all four densities
- [x] One export line in `packages/react/src/index.ts` and one import line in `packages/css/src/index.css`, as 0122 sets out
- [x] A snapshot shown through `CodeBlock.Snapshot` passes continuity at all four densities, where the same text in a plain `pre` does not
- [x] `fromText` round-trips every snapshot in the repository: text to buffer to text is unchanged
- [x] Long lines scroll horizontally in whole cells, declared as an exception with a reason; nothing else on the page scrolls sideways
- [x] Copy works by keyboard and announces once

## 2026-10-03

Copy state: the button says Copy, and Done for two seconds after, in the same four cells, with data-copied on the slot. I tried a check mark in a reserved cell first, but at rest it read as [   Copy ] with a hole in it. A word of the same width carries the state without colour and moves nothing. A reader hears 'Copied' once from a polite status, emptied first so a second copy is announced again. Clipboard errors say 'Could not copy'.

## 2026-10-03

Scrolling in whole cells: the code is a pre positioned in whole cells. Inside the code, a ruler of empty spans, one per cell of the longest line, is the snap points (scroll-snap-type: x mandatory), so a scroll comes to rest on a whole cell. The <code> declares data-rk-offgrid with the reason that it passes through fractions while it moves. The ruler had to go inside the <code>: outside it, conformance measured it and it was a fraction of a cell short. A synthetic arrow key does not scroll, so the story scrolls with scrollTo and checks the snap; a real key snaps the same.

## 2026-10-03

Snapshots: CodeSnapshot reads text back into cells with fromText and sets them, not their edges, inside the same frame, so the snapshot is a picture in the frame, not more lines for it to join. A reader gets one role=img named by label over its cells. The copy button sits outside that image, because an img's children are presentational. 'The same text in a plain pre does not pass continuity' is shown the way grid/Continuity's FontDrawn does it: the snapshot painted with its shapes handed back to the font, at touch density. A plain pre has no painted layer for the check to read. The fromText round-trip test covers the 20 published metadata snapshots and every inline text snapshot in the react and grid tests.

## 2026-10-03

codeRuns is CodeBlock's split of text into plain runs and cell-drawn shaped runs, the same rule as the site's rehypeCellGlyphs (a run of a spanning shape is one box). The site can call it instead of keeping its own copy; I've told the site lead. Not built: data-wrap (wrapping code in whole cells needs the engine's wrap and the browser's to agree line for line), and vertical scroll (a block is always as tall as its code). Both are proposed as follow-ups.

## Result

CodeBlock and CodeSnapshot. Code is real text in a painted frame with a title, a gutter rule joined by tees, and a keyboard copy that is announced once. Syntax roles come through rk-syntax-*, box drawing in code is cell-drawn via codeRuns, and long lines snap to whole cells as a declared exception. Snapshots are painted through the cell renderer and pass continuity at four densities; fromText round-trips every snapshot.

## 2026-10-03

At the site lead's request, codeRuns moved out of the 'use client' component into @rockaway/grid as shapeRuns, so the site's Node build can import it without a component module. CodeBlock calls it, and the code-block entry no longer exports a copy of its own.

---
id: 98
uid: d0b12e4c-f353-4241-8693-f27ad52062ef
title: StatusBar
type: component
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 117
- 118
- 132
created: 2026-09-22
updated: 2026-10-03
closed_at: 2026-10-03
priority: p0
layer: components
effort: m
---

## Purpose

The bar every TUI has: mode, context, position, and what the keys do. One row,
at the bottom of a screen. It is also where a transient message goes ("Copied
as ANSI"), because a TUI has a message line, not toasts. Not a toolbar of
controls, and not navigation.

## Anatomy

`<StatusBar label>` holding `<StatusSegment variant priority align label>`s and
at most one `<StatusMessage id duration>`. They are sibling exports, as
`ListItem` is, because `isolatedDeclarations` refuses `StatusBar.Segment`. The
bar is a `Screen` one row tall. The ground is painted in cells, and each
segment is a real element laid over it in whole cells, padded a cell either
side. Content is measured from the page in cells, because it is whatever the
caller puts there, KeyHints included. `fitStatus(width, segments)` is the pure
layout: start segments pack from the left, end ones from the right, centre ones
sit in the middle of what is left. When the row is too narrow, the lowest
priority is cut first, the later of equals first, down to a letter and the
theme's ellipsis and then away. `statusBarBuffer` draws text segments the same
way, for the snapshot.

## States

`data-variant="mode"` on the mode segment (a variant, `statusSegmentVariants`,
so it is declared rather than hand-set), drawn as reverse video.
`data-truncated` when a segment has been cut, and `hidden` when it has been cut
away. The message slot is never hidden, so it stays live. No 0118 state
applies: nothing in the bar is operated.

## Tokens consumed

`bg.subtle` for the ground, painted per cell; `fg.default` for the text. Reverse
video for the mode swaps the bar's own pair, `fg.default` behind `bg.subtle`,
rather than reading `bg.inverse` and `fg.on-inverse`. Forced colors maps that
pair to the canvas (0181), and swapping a gated pair keeps its contrast both
ways. In forced colors the mode opts out of the adjustment and swaps
`CanvasText` and `Canvas` itself, or the text's backplate hides it.

## Accessibility

A `footer`-level region whose message slot is `role="status"`, announced
politely and once. Segments are not live regions, so a changing position is
not read on every change.

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
- [x] Segments that truncate by priority when the screen narrows, never wrap
- [x] Reverse video for the active segment, with the contrast gate applied both ways
- [x] Announced as a status region, not read on every change
- [x] A message shows for a few seconds, is announced once, and is replaced, not stacked, by the next
- [x] Exactly one row at every density and every width down to 40 cells

## 2026-10-03

Rewritten by the program plan: the pre-pivot template text is replaced with how this works on the grid, the criteria are one list (the template, plus the contracts from the plan, plus this item's own), and the dependencies point at the contracts it is built on.

## 2026-10-03

Shape: StatusBar is a Screen one row tall whose ground (bg.subtle) is painted per cell, so the continuity check proves the fill. Segments are real elements laid over it in whole cells. Their content is measured from the page, because it is whatever the caller puts there, KeyHints included. Unmeasured segments are visibility: hidden for the one layout pass before paint. fitStatus is the pure layout, and statusBarBuffer draws text segments the same way, so the stories hold the page to the snapshot text at 120, 80, 60 and 40 cells at every density. StatusSegment and StatusMessage are sibling exports (isolatedDeclarations). Screen gains function children here as on feat/panes; the hunk is identical, so whichever merges second has no conflict.

## 2026-10-03

Cutting: the lowest priority first, the later of equals first so the bar keeps its left end. It shrinks to a letter plus the theme's ellipsis, then goes. The message slot is 'kept': cut, never hidden, so it stays a live region. 'data-active' from the ticket became data-variant='mode', a declared variant (statusSegmentVariants), because the metadata test refuses a hand-set attribute that is neither a state nor a variant, and the mode is a variant of a segment, not an interaction state.

## 2026-10-03

Reverse video swaps the bar's own pair rather than reading bg.inverse/fg.on-inverse, which forced colors maps to the canvas (0181). A swapped pair has the same contrast both ways, so the gate on fg.default over bg.subtle covers it. In forced colors Chromium painted a Canvas backplate behind the mode's text, so the word vanished into its own CanvasText-on-Canvas ground. The mode now opts out and swaps CanvasText and Canvas itself. The story asserts the opt-out and reads pixels: about 0.36 of the word's cells are ink with the fix, 0.08 without. Once #98 (0181) merges, move this to its shared pattern. The same bug was showing on List's selected rows; #98 fixes it.

## 2026-10-03

Message: StatusMessage is a polite role=status span that is always present and empty between messages. Text or a new id shows the message for duration (4s by default), then it clears, and the next replaces it. The Message story checks one live region in the bar, replacement rather than stacking, clearing, and that the slot element is the same one throughout.

## Result

StatusBar, StatusSegment and StatusMessage. One row with its ground painted in cells and segments laid over it in whole cells by the pure fitStatus. Segments are cut by priority with the theme's ellipsis, then hidden, never wrapped. The mode is reverse video by swapping the bar's own pair, opted out of the forced-colors backplate. The message slot is a polite live region, shown for a few seconds and replaced, never stacked.

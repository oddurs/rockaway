---
id: 297
uid: 4ab6cc01-4c94-4816-8ca8-0e0cb4537289
title: Set text in sizes measured in rows
type: component
status: doing
milestone: primitives
assignee: Oddur Sigurdsson
claimed: 2026-10-09
created: 2026-10-09
updated: 2026-10-09
priority: p0
layer: components
effort: m
---

## Purpose

A primitive for sized text (heading sizes 2 and 3 rows first) that works with no script, at every density and in both painters, sits inside frames whose lines meet it, and reads back through screenshot and copy.

It is for a page title and a landing line. It is not for a heading inside a component or a form, which weight, case and reverse carry at one row (0075), and not for block letters, which are a picture drawn by the cell renderer (0298).

## Anatomy

- `Text`, the element it is asked to be (`as`: a `div`, a `span` when `inline`, a paragraph or a heading of any level), with `.rk-text` and, inline, `.rk-text-inline`. It writes `--rk-size` and, inline, `--rk-chars`.
- `.rk-text-glyphs`, the words at their scaled size, in a line box N rows tall.

The rule, the formula and the measurements are decision 0296.

## States

None. It is text.

## Tokens consumed

`--rk-cell-line` (the density), `--rk-font-content` (the face's glyph box, new here), `--rk-cell-width`.

## Accessibility

Text, so no role of its own: a heading is a heading by its element. Its size is not announced. Copy gives its words alone. Zoom scales it with everything else, and forced colours draw it in the reader's text colour.

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
- [ ] Conforms at `strict`, or declares its exception with a reason
- [ ] Sizes 2, 3 and 4 are N rows and whole cells at every density, in both painters, with JavaScript off, at 200% zoom, and on Linux CI
- [ ] Every page with JavaScript off and on is the same, and the site has a page for it

## 2026-10-09

Rule 7 is left open on purpose: sized text does not conform at strict and is not excused there. Decision 0296 makes strict mean one size, so the conformance check reports each .rk-text on a strict screen as a SizedText violation that says why. The reviewer may prefer to call that the declared exception and tick it.

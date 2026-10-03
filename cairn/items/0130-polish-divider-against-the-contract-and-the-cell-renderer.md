---
id: 130
uid: a13961af-c9cf-4873-8768-059b43bf76c8
title: Polish Divider against the contract and the cell renderer
type: chore
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 47
- 117
- 118
- 119
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
priority: p1
layer: components
effort: s
---

## Problem

Divider shipped in 0097 before the cell renderer (0116, 0117), the state vocabulary
(0118), theme glyphs (0119) and the metadata schema (0047) existed. It has to
be brought up to the contract the components after it will be held to, so the
first thing a reviewer opens is not the weakest.

## Found in review

- Labelled rules exist but are only snapshotted at `start` alignment.
- Its open ends (`╶──╴`) come from the font; under 0117 they must be half
  strokes drawn by the cell, and the continuity check has to cover them.
- 0097 ticked "operable by keyboard alone" as vacuous; the metadata should say
  so rather than leave a reader to infer it.

## Acceptance criteria

- [x] Rendered by the cell renderer (0117): continuity passes at all four densities, with both stroke styles
- [x] Both painters render it identically: a test asserts it for every variant, not only the default
- [x] A `screenshot()` text snapshot of every variant and state is checked in, and reads like the component
- [x] Draws every state from the state vocabulary (0118); no state changes its size in cells
- [x] Reads its glyphs from the theme (0119): no box-drawing, block or mark literal left in its source
- [x] Metadata written to the schema (0047), and validated by its test
- [x] Stories cover every state at every density (via 0125 once it lands), with a keyboard walkthrough
- [x] The body of 0097 is brought up to date: Purpose, Anatomy, States, Tokens and Accessibility describe what shipped, and no template placeholder is left
- [x] Open ends, joined ends and labelled rules at every alignment pass continuity

## 2026-10-03

Open ends: since 0117 the half strokes ╶ ╴ ╷ ╵ are shapes the cell draws (shapes.css), not font glyphs. What was missing was continuity coverage for them. Four Continuity stories, one per density and tagged zoom, now draw every variant with both painters: open, joined, each set, labels at every alignment on open and joined rules, truncated, vertical, and an ASCII theme. They assert layer and join counts.

## 2026-10-03

A label on an open rule used to sit straight after the half-stroke end, ╶ files ───╴, and in screenshots the stranded half cell read as a glitch. It is now inset by a whole cell of line, ╶─ files ──╴. A joined rule keeps the frame-title placement, ├ files ──┤. 0175 (#82) moves label drawing into grid's label.ts. On rebase this inset becomes the rect passed to drawLabel, and the label call needs lineStyle: LINE and style: TEXT. I resolved this once already against #82's branch, so it is a small conflict.

## 2026-10-03

Colour: the line is border.default (done on polish/frame, since a frame's dividers share drawRule) and the label is now explicitly fg.default. A rule drawn in the ascii set truncates with ~ whatever the theme, as Frame does. The metadata says outright that a divider has no keyboard and no states because there is nothing to operate, and that a splitter would be a different component. States criterion ticked on that basis. The cellsOf helper moved to apps/workbench/src/cells.ts, shared by the Frame and Divider stories.

## Result

Divider's line is border.default and its label fg.default. A label on an open rule keeps a cell of line from the half-stroke end (╶─ files ──╴). ASCII rules truncate in ASCII. Every variant is snapshotted and painter-identical, and open ends, joins and labels pass continuity at four densities and 200%.

## 2026-10-03

Brought up to date with main through polish/frame. The label now goes through #82's drawLabel in grid's label.ts. The open-end inset becomes the rect it is given, with style TEXT, lineStyle LINE and the ASCII ellipsis, so a label also gives way to a rule crossing it. Under #82's room rule a short rule's label keeps one more letter: '╶─ far to… ──╴'. The continuity stories' zoom tag moved onto each story, because Storybook cannot read a tag set inside a factory.

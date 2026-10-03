---
id: 129
uid: cfa8b627-4083-4f75-8a06-4f6b799f77dc
title: Polish Frame against the contract and the cell renderer
type: chore
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 47
- 117
- 118
- 119
- 175
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
priority: p1
layer: components
effort: s
---

## Problem

Frame shipped in 0096 before the cell renderer (0116, 0117), the state vocabulary
(0118), theme glyphs (0119) and the metadata schema (0047) existed. It has to
be brought up to the contract the components after it will be held to, so the
first thing a reviewer opens is not the weakest.

## Found in review

- The default border is `single` whatever the theme's `borderSet` input says;
  the theme never reaches the screen (fixed in 0119, adopted here).
- 0073 says "a heavy box may hold light dividers", but `dividers` always use
  the frame's own set. Add a divider weight.
- Both-painter parity is asserted for the default only.
- The `rounded` title truncates to `round…` in the border-set snapshot at a
  width where it would fit with one fewer padding cell; check the truncation
  rule is the one we mean.

## Acceptance criteria

- [x] Rendered by the cell renderer (0117): continuity passes at all four densities, with both stroke styles
- [x] Both painters render it identically: a test asserts it for every variant, not only the default
- [x] A `screenshot()` text snapshot of every variant and state is checked in, and reads like the component
- [x] Draws every state from the state vocabulary (0118); no state changes its size in cells
- [x] Reads its glyphs from the theme (0119): no box-drawing, block or mark literal left in its source
- [x] Metadata written to the schema (0047), and validated by its test
- [x] Stories cover every state at every density (via 0125 once it lands), with a keyboard walkthrough
- [x] The body of 0096 is brought up to date: Purpose, Anatomy, States, Tokens and Accessibility describe what shipped, and no template placeholder is left
- [x] Dividers take their own border set, and a heavy frame with light dividers resolves its tees through the junction table, in a snapshot

## 2026-10-03

Colour: a frame's lines are border.default and its title fg.default (CTO's call, after screenshots showed border.default at 1.2:1 would make frames vanish; 0178 raised it to 3:1 first). The colour is carried by each cell of the buffer, not set on the chrome layer by CSS as first proposed: with the layer coloured, an ASCII frame's rows painted as one text run, '|  spaces  |', and axe failed it for text contrast. Per-cell style makes each line its own run (axe skips runs of punctuation), and puts the colour in ANSI output too. A framed control recolours by drawing its own style when it redraws heavy for focus, which it has to do anyway. The extractor now reads buffer colours (strings like 'border.default') as tokens, so the metadata lists border.default.

## 2026-10-03

dividerBorder: one set for every divider, the frame's own by default. A per-divider object ({row, border, label}) is more general, but nothing needs it yet. A heavy frame with light dividers gives ┠──┨, a double one ╟──╢; both in frame.test.ts and the metadata. Dividers between rows (1.5) are now dropped like ones off the frame, rather than drawn at a fractional row.

## 2026-10-03

Title truncation: the found-in-review bullet (round… at width 12) is fixed in 0175 (#82), which took the rule 'the corners plus at least one cell of edge', room = width - 3, at my request, so drawTitle is changed in one place. This PR's snapshots show the old rule and change when #82 lands. Also: a frame drawn in the ascii set truncates with the ASCII ellipsis (~) whatever the theme; before, an explicit border='ascii' in a Unicode theme ended its title in ….

## 2026-10-03

Found at 40 cells wide: Screen measured a box exactly 40ch wide as 39 cells, because the measured cell is rounded to 1/64px and can be 1/128px wider than the advance (385.3125 / 9.640625 = 39.97). Fixed here by counting with metrics.width - 1/128, with a Grid/Screen story at 40, 60, 80 and 120ch that fails without it. #83 (fix/cell-exact) removes the cause by not rounding the cell. When #83 lands, drop this adjustment and keep the story.

## 2026-10-03

States: none of its own. A frame has nothing to operate, so 0118's rows do not apply to Frame itself. A framed control (0035, 0127) draws focus-framed and invalid on its frame. The metadata says so in its accessibility notes, and criterion 4 is ticked on that basis, as 0097's keyboard criterion was. Stories: every variant at every density, with both painters, through the four Continuity stories, tagged zoom so they also run at 200%. These don't wait on 0125. The zoom project now selects stories by a 'zoom' tag rather than by file name.

## Result

Frame draws its lines in border.default and its title in fg.default, carried per cell. dividerBorder lets a heavy frame hold light dividers (┠──┨). A frame in ASCII truncates in ASCII. Every variant is snapshotted, painter-identical, and continuous at four densities and 200%. A framed control draws 0118's focus-framed and invalid on the frame by redrawing it heavy in its own colour.

## 2026-10-03

Brought up to date with main after #82, #83 and #77 merged. #82's title rule shows in the snapshots: 'a title fa… ─┐'. The Screen adjustment of minus 1/128 is gone, since #83 keeps the cell the font's true advance. The 40/60/80/120ch story passes without it. The continuity stories' zoom tag had been set inside a factory function, and Storybook reads tags from the source without running it, so the zoom browser was silently skipping them. The tag is now written on each story.

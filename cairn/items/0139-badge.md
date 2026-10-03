---
id: 139
uid: 3c9825f7-b830-4060-b8b4-0edeac238130
title: Badge
type: component
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 32
- 118
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
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
- [x] Every tone carries a mark or a word as well as a colour, shown in a greyscale story

## 2026-10-03

Claimed with --force on the CTO's assignment: 0032's helper and 0118's vocabulary are both in use on main.

## 2026-10-03

Each tone draws a mark from the theme before its words, chosen from what 0118 already means: accent the filled dot (mark.radio), success the check, warning '!' (mark.danger), danger the cross. Danger takes the cross rather than 0118's '!' for a danger variant because a badge reports an outcome, not a destructive action: a failing check is 0118's invalid row. That leaves '!' for warning, which has no row. Neutral has no tone to state, so it is delimited ([beta]) with glyph.delimiter.control, the only delimiter set the theme has. mark={false} draws any tone delimited, and then its words must say the tone; the greyscale story shows both rows.

## 2026-10-03

Geometry: both forms are exactly two cells beyond the words (the mark and a cell of air, or the two delimiters), so mark={false} never changes the width, and tone rules set only three custom properties (words, ground, edge). The badge is an inline-block with white-space: pre, so the ground fills the whole cell rather than the font's height and the space after the mark is a real cell; the In prose story measures one cell tall at whole-cell widths. Neutral delimiters use border.control: border.default nearly vanished against bg.subtle.

## 2026-10-03

Not interactive, so criteria 1 and 11 hold by having nothing to operate: no role, no tabindex, and the keyboard walkthrough shows Tab passing from the button before a badge to the button after it. Criteria 4 and 5 are left open because axe fails fg.success on bg.success.subtle in light mode (4.41:1) wherever Chromium matches color-gamut: p3. The tokens' p3 override for ansi-green escapes the contrast gate, which checks only the sRGB value (4.53:1). The CTO is filing that as a p0 tokens bug, so Badge keeps its design and is not changed to suit it. Criterion 6 waits on 0047, criterion 16 on 0117.

## 2026-10-03

Rebased onto main after 0047 and 0117 landed: badge.meta.ts written to the schema (tone values described, no states, snapshot drawn by badgeBuffer), a Badge fixture added to the metadata test, and a changeset added, which main now requires. The rebase's merge=union on index.ts doubled Button's line against main's new one; resolved by hand from main plus Badge's line.

## 2026-10-03

Criteria 4, 5 and 16 ticked from the 0131 branch, as agreed with the CTO: once 0163 held the p3 overrides to the contrast gate, CI ran axe green on every Badge story in light, dark (the Dark story) and forced colors (the tagged story); and 0117's continuity check runs after every story, Badge's included, at the densities its stories draw.

## Result

Badge ships: tone variant with a theme mark per tone (neutral delimited), mark={false} for the delimited form, both forms two cells wider than the words.

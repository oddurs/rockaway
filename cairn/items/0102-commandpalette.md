---
id: 102
uid: fca743a4-6962-4a12-83da-78de22777efc
title: CommandPalette
type: component
status: doing
milestone: primitives
assignee: Oddur Sigurdsson
claimed: 2026-10-03
depends_on:
- 35
- 39
- 133
- 141
created: 2026-09-22
updated: 2026-10-03
priority: p0
layer: components
effort: l
---

## Purpose

`⌘K`. The front door of a keyboard-first interface, and the thing the site is
judged on. Search commands and pages, run one, and get out of the way. Not a
general search results page.

## Anatomy

`<CommandPalette>` on React Aria's `Autocomplete` with a `Menu` inside a
Dialog (0039): an input row with a `›` prompt, then results in sections, each
row a label, its matched characters marked, and a KeyHint when the command has
a chord. Opened by `⌘K` through the keymap (0141).

## States

`data-loading`, `data-empty`, plus Menu's row states.

## Tokens consumed

Dialog's, TextField's and Menu's tokens; `fg.accent` for matched characters as well as the attributes.

## Accessibility

A `dialog` containing a combobox-pattern input and a `menu` of results, through
React Aria: arrows move through results while focus stays in the input, Enter
runs, Escape closes and restores focus. The result count is announced as it
changes.

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
- [ ] Fuzzy match with the matched cells marked by attribute, not only colour
- [ ] Opens over any screen, traps focus, restores it, and closes on Escape
- [ ] Works on touch as a sheet at touch density
- [ ] Empty, loading and no-match states are all drawn, not improvised
- [ ] Opens from `⌘K` and `/` through the keymap, and the chord is shown in the input row

## 2026-10-03

Rewritten by the program plan: the pre-pivot template text is replaced with how this works on the grid, the criteria are one list (the template, plus the contracts from the plan, plus this item's own), and the dependencies point at the contracts it is built on.

## 2026-10-03

Pure half first, while Dialog (#169) and TextField (#117) land: fuzzyMatch (a subsequence ignoring case, every start of the first character tried, word starts and runs scored up, gaps down), matchCommands (sections kept; with a query, ranked within a section and sections by their best), paletteState (results, loading, empty, no-match) and commandPaletteBuffer, the modal frame with the input row, a rule, section titles set into the frame as Menu's are, matched graphemes underlined and in the accent. The results scroll on their own under a fixed input row, so their position is a List scrollbar column, not the frame edge, which would run past the input row. The prompt mark is glyphs.mark.prompt from tokens' #183; the cursor mark stands in until it lands.

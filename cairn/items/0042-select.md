---
id: 42
uid: 570abc45-84f2-4acc-8874-7c47bb60ab01
title: Select
type: component
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 34
- 127
- 133
created: 2026-09-22
updated: 2026-10-03
closed_at: 2026-10-03
priority: p1
layer: components
effort: m
---

## Purpose

Choose one value from a list too long for radios: a branch, a theme, a
language. Not for free text (TextField, or Combobox when typing should
filter), and not for actions (Menu).

## Anatomy

`<Select label>` on React Aria, built from the field parts (0127). The trigger
is a field row, `Theme  [phosphor        ▾]`, exactly `cols` cells wide; the
popover (0034) is at least as wide and holds a List-drawn `ListBox` (cursor,
reverse-video selection, the selected value's `✓` in its mark cell).

## States

`data-open`, `data-focused`, `data-focus-visible`, `data-disabled`, `data-invalid`, `data-required`, `data-placeholder`, plus List's row states inside.

## Tokens consumed

`bg.subtle`, `fg.default`, `fg.muted` (placeholder), `border.control`, `border.focus`, `fg.danger`, and List's row tokens.

## Accessibility

React Aria's select: a button that opens a `listbox`, labelled by the field
label; arrows open and move, type-ahead selects even while closed, Escape
closes, and the value is announced. A hidden native `select` keeps form
submission and autofill working.

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
- [x] Type-ahead selects with the popover closed, in a keyboard story
- [x] The popover's rows line up with the trigger's value cell
- [x] Works inside a Form (0127) with native validation and submission

## 2026-10-03

Rewritten by the program plan: the pre-pivot template text is replaced with how this works on the grid, the criteria are one list (the template, plus the contracts from the plan, plus this item's own), and the dependencies point at the contracts it is built on.

## 2026-10-03

Built on the overlay contract (#149) with OverlayPopover standing in for Popover (0034), whose API overlays has settled (placement 'bottom start', maxRows, minCols default 'trigger') but not pushed; the switch is one import once feat/popover lands, and the 'at least as wide as the trigger' story comes with it. The trigger is [ value… ▾]: the value starts in its third cell because the popover's content inset is two cells (border plus air, confirmed by overlays), so the popover's rows start in the value's column. Rows reuse List's classes and listMarks with two reserved cells (cursor, check), as the item asks; the list sets white-space: pre because the overlay body wraps and an empty mark cell would collapse to nothing and sit half a cell low.

## 2026-10-03

The visible value is aria-hidden and cut/padded to its cells; a VisuallyHidden copy gives the reader the whole value, so the name never holds the ellipsis (checkField caught 'Choose…'). The placeholder is React Aria's data-placeholder on SelectValue, not hand-set; the state vocabulary's placeholder row gains [data-placeholder] beside :placeholder-shown. The open mark is its own span in fg.default: in the delimiters' border.control colour it was 4.48:1 on bg.surface and failed axe.

## 2026-10-03

Now on Popover (feat/popover, 6d2fdec): one import swapped, and an 'At least as wide as its trigger' story asserts the 30-cell popover under a 30-cell trigger with narrower options, from Popover's minCols; Select sets no width. Criterion 8 (both painters) left open: Select's own cells draw nothing painted, but Popover always paints glyph even when opened from a rule-painted screen, a #149 issue fields is fixing; once that lands a Painters story can hold both.

## 2026-10-03

Criterion 8 met after merging feat/popover at c72523e (with #149's update): the painter now crosses the portal, and 'Painted, glyph' and 'Painted, rule' each hold the open select to the same model, the popover's layer painted with the screen's painter. popover.css is gone from feat/popover, so the union-merged CSS index line for it is dropped here.

## Result

Select is a field: label column, a trigger exactly cols wide ([ value ▾], value in the third cell), description and error under it. It opens Popover on the row under the trigger, at least as wide as it (minCols), its rows List's (cursor, reverse, check) starting in the value's column. The value is drawn cut and read whole; placeholder via React Aria's data-placeholder, now in the state vocabulary. Type-ahead closed, native validation and submission through the hidden select; both painters, every density, dark, forced colors, strict.

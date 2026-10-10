---
id: 37
uid: 9e39811b-f2b5-4a99-8266-66aa8584810d
title: Switch
type: component
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 119
- 127
created: 2026-09-22
updated: 2026-10-03
closed_at: 2026-10-03
priority: p1
layer: components
effort: s
---

## Purpose

An on/off setting that takes effect immediately: `[──●] Wrap lines`. Not for a
choice that is submitted with a form (Checkbox).

## Anatomy

`<Switch>` on React Aria. Delimiters around a three-cell track; the thumb sits
at the start when off and the end when on, and on is also reverse video:
`[●──] Off-label`, `[──●] On-label`. The label does not change with the
state.

## States

`data-selected`, `data-hovered`, `data-pressed`, `data-focus-visible`, `data-disabled`, `data-readonly`.

## Tokens consumed

`fg.default`, `bg.inverse`, `fg.on-inverse`, `fg.disabled`, `border.control`.

## Accessibility

`role="switch"` with `aria-checked`, through React Aria. Space toggles. The
track and thumb are `aria-hidden`; the name is the label only.

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
- [x] On and off differ in the thumb's position and in reverse video, and snapshot differently
- [x] The control is the same width in both states

## 2026-10-03

Rewritten by the program plan: the pre-pivot template text is replaced with how this works on the grid, the criteria are one list (the template, plus the contracts from the plan, plus this item's own), and the dependencies point at the contracts it is built on.

## 2026-10-03

Claimed with --force past 0127: the field contract's code is on main (#94) and the brief builds on it; 0127 stays open only for its 'used by every field component' criterion, which this item helps make true.

## 2026-10-03

Built on React Aria's SwitchField + SwitchButton (Switch is deprecated in 1.21), so the root is a field (fieldClass) and Description/FieldError attach by context. The label is the switch's own words, no Label part, per the contract's rule for controls that carry their own words. No isRequired/isInvalid/validate: a setting that is already applied has nothing to validate, and a must-answer choice is a Checkbox. FieldError is still rendered so a Form's validationErrors reach it by name; invalid colours the delimiters border.danger.

## 2026-10-03

The track is geometry: the default theme's switch-track mark is ─, which 0116 says the cell draws, not the font. The three cells are rendered in JSX as the painter's runs (rowRuns from paint/cells.ts), inside an aria-hidden indicator, so shapes.css strokes the line, checkContinuity reads it (it runs at every density and at 200% zoom on the Densities story), and a server renders the same cells. painter prop picks glyph or rule strokes. Under ASCII the track is '-', a letter.

## 2026-10-03

States: on = thumb at the end + track reversed (bg.inverse/fg.on-inverse via custom properties on the button). Pressed reverses the track, an on track back (0118's filled-control rule). Read-only removes the track's line and ground: [  ●]. Focus ring is drawn on the label element from data-focus-visible, because the real focus is on a visually hidden input whose own outline cannot be seen. Forced colors: the track opts out of the backplate and the shape ink is set to currentColor, because screen.css forces it to CanvasText, which is the reversed track's ground — the line would vanish.

## 2026-10-03

Found and fixed in testing/targets.ts: checkTargets measured React Aria's visually hidden native input (13x13px) instead of the label a pointer presses, so a switch, checkbox or radio could never pass the target check even after 0197. It now measures a visually hidden input through its label. Told the fields engineer (Checkbox) so the fix is not made twice.

## 2026-10-03

Criterion 11: operable by keyboard alone (Keyboard story), and the whole row, track and words, is the target: 32px tall at touch today, which passes WCAG 2.5.8's 24px; the 44px that 0074 promised arrives with the touch line box in 0197 (the touch-height known failure covers it until then). Criterion 13: a Strict story pins conformance=strict with no declared exception.

## Result

Switch is SwitchField + SwitchButton with fieldClass: [●──] off, [──●] on with the track reversed; pressed reverses the track (on reverses back), read-only drops the track and its ground, disabled dims; no state changes its cells. The track is rendered as the painter's runs so the cell strokes the line, and a server renders it. No validation props; Description and FieldError from the field contract. checkTargets now measures a visually hidden input by its label.

---
id: 33
uid: 3ffe299c-0f5b-40b5-986c-e6d59b523cec
title: Button
type: component
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 21
- 24
- 31
- 86
created: 2026-09-22
updated: 2026-09-23
closed_at: 2026-09-23
priority: p0
layer: components
effort: m
---

## Purpose

An action: save, submit, publish, open a dialog. Delimited text, `[ Publish ]`,
one row tall, that inverts when you press it, the way a terminal has always
shown a key going down. Not for going somewhere (that is Link), not for a
status that cannot be pressed (Badge), and not for a chord with no action
(KeyHint).

## Anatomy

`<Button variant delimiters keys platform>label</Button>` on React Aria's
Button. Every cell is text the component writes; the stylesheet adds none:

- **delimiters** (`.rk-button-end`, aria-hidden): the theme's control
  delimiters, the closing one with the cell of air before it. `delimiters`
  replaces them, or `"none"` removes them and the air with them, for a toolbar.
- **mark** (`.rk-button-mark`, aria-hidden): the cell after the opening
  delimiter, blank, or the theme's `mark.danger` (`!`) for danger. Every
  delimited button has it, so the mark costs no cell. Danger keeps its
  delimiters whatever `delimiters` says, so its mark always has a cell.
- **label** (`.rk-button-label`): the text, then the decorative KeyHint when
  `keys` is set.

Variants, from the variant helper (0032): `variant` is `default`, `fill`
(reverse video, the primary) or `danger`. `quiet` and `size` (with `lg`) were
removed in 0131: `quiet` was `delimiters="none"` under another name and the
one declared geometry exception, and `lg` claimed a frame it never drew.
`buttonBuffer` draws any button as text.

## States

From 0118, none of which changes a cell: `data-hovered` underlines the label;
`data-focus-visible` is the focus ring (an outline, no cell); `data-pressed`
reverses the video, and a `fill` button reverses back so a press always shows,
while danger presses to `bg.danger-solid`; `data-disabled` dims.

## Tokens consumed

`fg.default`, `bg.inverse` and `fg.on-inverse` for fill and pressed;
`bg.page` for a pressed fill; `fg.danger`, `border.danger`, `bg.danger-solid`
and `fg.on-danger` for danger; `border.control` for the delimiters;
`fg.disabled`; `size.control.md` for its one row; the focus ring's tokens.
Glyphs: `glyph.delimiter.control`, `glyph.mark.danger`, `glyph.mark.blank`,
and `glyph.key.*` through the hint.

## Accessibility

Role `button`; the name is the label's text, never a glyph: the delimiters,
the mark and the hint are aria-hidden. Enter and Space press it (React
Aria's onPress); disabled leaves the tab order. With `keys` it sets
`aria-keyshortcuts` for the same keyboard the hint is drawn for, through
`usePlatform()` (0132). Danger's `!` is not announced, so the label has to
say what is destructive.

## Acceptance criteria

- [x] Built on the behaviour layer; no hand-rolled focus or keyboard logic
- [x] Styled from `data-*` state and semantic tokens only
- [x] Stories cover every state, and run as Vitest browser tests
- [x] axe passes; keyboard walkthrough recorded in the story
- [x] Light, dark and forced-colors verified
- [x] Metadata written: props, anatomy, when to use, when not to

## 2026-09-22

Goes first: this is where the component contract is proven. Anything awkward here is a change to the contract, not a workaround in Button.

## 2026-09-22

## TUI criteria (added by the pivot, cairn 0076)

- [x] Sized in cells, and drawn by the frame engine: no box characters written by hand
- [x] Frame glyphs are `aria-hidden`; the accessible name never contains one
- [x] Ships a text snapshot, which is its documentation as much as its test
- [x] Operable by keyboard alone, and usable with a finger at touch density
- [x] State reads without colour: an attribute or a mark carries it too
- [x] Conforms at `strict`, or declares its exception with a reason

## 2026-09-23

The conformance criterion earned its keep before the component was finished. A button measured 11.246 cells wide instead of 10: Chrome gives every <button> a UA padding of 1px 6px, stated in pixels, and reset.css never neutralised it. Every control in this milestone would have been 12px off the grid. Fixed in the reset for input, button, textarea and select — padding and border-width start at nothing, and a component adds whole cells.

## 2026-09-23

Delimiters are chrome. [ and ] are aria-hidden spans, so the accessible name is 'Publish' and not '[ Publish ]', and the screenshot test still sees them because they are real text nodes rather than pseudo-element content. They are a prop for now (delimiters, or 'none'); if a second component needs them they become a glyph token, which is the more honest home.

## 2026-09-23

Variants are attributes before they are colours: fill is reverse video and nothing else, so the primary survives forced colors and greyscale; pressed inverts, which is how a terminal shows a key going down, and a fill button inverts back so the press always shows; hover underlines; disabled dims. Only danger carries a hue, and it still changes the border and the ground on press.

## 2026-09-23

The delimiter colour is one custom property set on the button, not a descendant selector per state. Biome flagged the descending-specificity version, and it was right: every state is now a rule on the button itself and the cascade cannot get the order wrong.

## 2026-09-23

Noted while measuring: the probe-measured cell (9.6328px) and the font's true advance (9.6406px) differ by 0.008px. Harmless at the 0.5px conformance tolerance, but it accumulates — about 0.6px across an 80-cell screen. Worth remembering if a wide element ever fails conformance by a hair. Also, the workbench renders in the system mono stack, not JetBrains Mono: the default type pairing is 'system', and the preview only loads the font. Not wrong, but not what the screenshots imply.

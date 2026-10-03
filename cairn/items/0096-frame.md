---
id: 96
uid: b8a52e51-7044-4528-a43a-af56ad8ff79c
title: Frame
type: component
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 86
created: 2026-09-22
updated: 2026-09-23
closed_at: 2026-09-23
priority: p0
layer: components
effort: m
---

## Purpose

The box every other component is drawn inside: a border set, a title in the
top edge, padding in cells, and dividers that join their sides. A pane, a
panel, a dialog body; sections that share one border.

## Anatomy

`<Frame title titleAlign border dividers dividerBorder pad label>`, a `Screen`
underneath. Its chrome is `frameBuffer(size, options, glyphs)`, a pure buffer
function: the border by `drawBox`, the title set into the top edge, and each
divider by `Divider`'s own `drawRule`, so a rule meets the sides as a tee from
the junction table. Content is real elements in `.rk-content`, inset by the
border's cell plus `pad` (default one cell across, none down). `border` is the
theme's set unless given; `dividerBorder` is the frame's own unless given, so a
heavy box may hold light dividers (`┠──┨`). A title too long for its edge
truncates with the theme's ellipsis, or `~` in a frame drawn in ASCII. A
divider on the border, outside the frame or between rows is dropped.

## States

None of its own: a frame has nothing to operate. A framed control draws 0118's
`focus-framed` and `invalid` rows on its frame (the heavy set, recoloured) in
the same cells.

## Tokens consumed

`border.default` for every line, carried by each cell of the buffer so it is
the same colour on a page and in ANSI; `fg.default` for the title. Strokes are
`stroke.glyph.*` or `stroke.rule.*` by painter (0117). Forced colors draws
every stroke in `CanvasText`. `border.default` is held to 3:1 by 0178.

## Accessibility

A titled frame is `role="group"` named by its title, or by `label`; with
neither it has no role. Every glyph, the title as drawn included, is
`aria-hidden`. Never a tab stop: Tab goes straight to its content in DOM order,
and the focus ring is not clipped by the border.

## Acceptance criteria

- [x] Any border set, with the junction model resolving every seam
- [x] A title truncates with the border, never past it
- [x] Glyph and rule painters both render it identically, measured in cells
- [x] `aria-hidden` chrome; the region's accessible name comes from its title text, not its glyphs

## TUI criteria (added by the pivot, cairn 0076)

- [x] Sized in cells, and drawn by the frame engine: no box characters written by hand
- [x] Frame glyphs are `aria-hidden`; the accessible name never contains one
- [x] Ships a text snapshot, which is its documentation as much as its test
- [x] Operable by keyboard alone, and usable with a finger at touch density
- [x] State reads without colour: an attribute or a mark carries it too
- [x] Conforms at `strict`, or declares its exception with a reason

## 2026-09-23

Built as a pure buffer plus a thin component: frameBuffer(size, options) is the geometry (testable in Node, and what the server renders), Frame wires it to Screen. Dividers are a declarative prop on the frame, not a child component — a child cannot contribute edges to its parent's buffer without a second render pass, and the engine's whole point is that the parent draws the chrome from one description. 0097 Divider is therefore the standalone rule between panes; a divider inside a frame is this prop.

## 2026-09-23

Two bugs found on the way. (1) The screen CSS only ever existed in a workbench demo file, so .rk-screen, .rk-frame and .rk-content were undefined for any consumer of @rockaway/css: promoted to packages/css/src/screen.css. (2) Worse, my first version of it set line-height from --rk-cell-height, which Screen writes from its own measurement — a closed loop, so the first paint's 20px fallback became the line box at every density and the density context never arrived. The line box belongs to density and a screen must inherit it. The Densities story catches it: four densities, four heights, each taller than the last.

## 2026-09-23

Also fixed: the Storybook density toolbar still offered compact/regular/comfortable, which retheme replaced with dense/normal/airy/touch. Nothing matched, so every story since retheme had been running at the :root default and the switch did nothing.

## 2026-09-23

Screen gained two things components need: it spreads HTML attributes onto the host (so a component can name itself — Frame passes role=group and aria-label from the title string, never the glyphs), and contentInset, which insets the content layer in cells. The inset goes on .rk-content deliberately: that box is already excused from the grid check, because a measured screen is whatever width the page gives it.

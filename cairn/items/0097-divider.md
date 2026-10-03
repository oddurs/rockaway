---
id: 97
uid: 6b06032d-e21f-4fe3-a313-9b5e54e5ce9f
title: Divider
type: component
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 86
created: 2026-09-22
updated: 2026-09-23
closed_at: 2026-09-23
priority: p1
layer: components
effort: s
---

## Purpose

A rule across a frame or between panes, joining the sides it meets. A
separator, not a decoration, and not a splitter: there is nothing to operate.

## Anatomy

`<Divider orientation border label labelAlign ends>`: a one-cell `Screen`, as
tall as a row for a horizontal rule and as wide as a column for a vertical
one, measured along its length unless `cols` or `rows` fixes it. Its chrome is
`dividerBuffer(size, options, glyphs)`, which calls `drawRule`, the same
function a frame's `dividers` use. A rule adds edge weights and nothing else.
An open end is a half stroke (`╶──╴`). `ends="joined"` adds the crossing edges
so the table draws tees (`├──┤`, `┬ │ ┴`). Inside a frame that changes nothing,
because the sides already carry those edges. `border` is the theme's set unless
given. A label (horizontal only) sits at the start, centre or end. On an open
rule it keeps a whole cell of line between it and the end, so the half stroke
is never stranded: `╶─ files ───╴`. It truncates with the theme's ellipsis, or
with `~` in a rule drawn in ASCII.

## States

None: a divider has nothing to operate.

## Tokens consumed

`border.default` for the line, carried by each cell so it is the same on a
page and in ANSI; `fg.default` for the label. Strokes, the half strokes at an
open end included, are drawn by the cell (0117) in `stroke.glyph.*` or
`stroke.rule.*`. Forced colors draws every stroke in `CanvasText`.

## Accessibility

`role="separator"` with `aria-orientation`, named by `label` when it has one;
the rule's glyphs are `aria-hidden` and never in the name. Not React Aria's
`Separator`, whose `<hr>` would draw a second line beside the painted one.
Never a tab stop: Tab goes from the control before it to the control after it.
A frame's own dividers are chrome, not separators, so a reader does not step
through them.

## Acceptance criteria

- [x] Horizontal and vertical, with weight from the border set
- [x] Joins its container through the junction model, never by drawing its own corners
- [x] `role="separator"` with an accessible orientation

## TUI criteria (added by the pivot, cairn 0076)

- [x] Sized in cells, and drawn by the frame engine: no box characters written by hand
- [x] Frame glyphs are `aria-hidden`; the accessible name never contains one
- [x] Ships a text snapshot, which is its documentation as much as its test
- [x] Operable by keyboard alone, and usable with a finger at touch density
- [x] State reads without colour: an attribute or a mark carries it too
- [x] Conforms at `strict`, or declares its exception with a reason

## 2026-09-23

One rule implementation, two entry points. drawRule(draft, line, options) adds edges into any draft; dividerBuffer wraps it for the standalone component, and Frame's dividers prop calls the same function — so 'joins through the junction model' is not a claim about two code paths agreeing, it is one path. A test asserts the frame's divider and a hand-drawn rule into the same buffer are identical text.

## 2026-09-23

ends='joined' adds the crossing edges to the rule's own end cells so the table resolves a tee with nothing to meet. Inside a frame it is a no-op, and a test pins that: the border already carried north and south there, and mergeEdges takes the heavier. That is the cleanest demonstration of why the edge model was worth it — the divider never picks a glyph, so it cannot pick the wrong one.

## 2026-09-23

An open rule comes out as ╶──────────╴ — the end cells have one edge each, so the table gives the half-stroke glyphs from the Unicode block. Nobody wrote that case; it fell out.

## 2026-09-23

Not React Aria's Separator: it renders an <hr>, whose browser border would draw a second line beside the painted one, and there is no behaviour to inherit because a divider has nothing to operate. The Screen host takes role=separator and aria-orientation directly. 'Operable by keyboard alone' is ticked as vacuous, not as done — there is no operation. A resizable splitter would be a different component with real behaviour.

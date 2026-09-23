---
id: 97
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

A rule across a frame or between panes, joining the sides it meets.

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

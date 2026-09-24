---
id: 99
title: KeyHint
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

`^S save` — the footer hint and the inline shortcut, which is how a TUI teaches
itself.

## Acceptance criteria

- [x] Renders the platform's modifier glyphs, and says them properly to a screen reader
- [x] Sits inside a `<kbd>`, and never becomes the accessible name of the thing it labels

## TUI criteria (added by the pivot, cairn 0076)

- [x] Sized in cells, and drawn by the frame engine: no box characters written by hand
- [x] Frame glyphs are `aria-hidden`; the accessible name never contains one
- [x] Ships a text snapshot, which is its documentation as much as its test
- [x] Operable by keyboard alone, and usable with a finger at touch density
- [x] State reads without colour: an attribute or a mark carries it too
- [x] Conforms at `strict`, or declares its exception with a reason

## 2026-09-23

One spec, three strings, and all three are needed: what you see (⌘S, Ctrl+S, ^S), what a reader hears ('Command S', because ⌘ is not a word), and what the platform is told (Meta+s, for aria-keyshortcuts). formatKeys, spokenKeys and keyShortcut are pure, so the snapshot is a table of every chord on every keyboard in both notations — that table is the documentation.

## 2026-09-23

The snapshot caught a real defect while it was being written: in terminal notation shift+up rendered as a bare ↑, because shift is normally carried by a capital letter and an arrow has no capital. Named keys now get an explicit ⇧, single letters still do not — ^K and ^⇧K are the same chord to a terminal.

## 2026-09-23

React Aria filters the DOM props it forwards down to the labelling set, so aria-keyshortcuts never reaches the element through props. Button therefore takes a keys prop of its own: it draws the decorative hint beside the label and sets the attribute on the element in an effect. That is the better API anyway — <Button keys="mod+s">Save</Button> puts the chord, the hint and the announcement in one place.

## 2026-09-23

Two refinements to grid conformance, both forced by this component and both principled rather than convenient. (1) An inline box is measured across but not down: its width is a sum of character advances, but its height is the font's ascent and descent and no stylesheet can make that equal the line box — that is what an inline box is. The block that owns the line box is still checked. (2) Visually hidden text is not measured at all: the sr-only technique leaves a 1px box at a fractional offset, and it has no visual geometry because nobody can see it. Detected by its clip rectangle or clip-path, so react-aria's VisuallyHidden and any hand-rolled equivalent are both covered.

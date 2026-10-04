---
id: 183
uid: 7cbf09b7-ae58-4b2e-a5f4-43102e3847f9
title: Decide what goes heavy means under an ASCII theme
type: decision
status: done
milestone: primitives
depends_on:
- 118
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
priority: p2
layer: grid
effort: s
---

## Context

0118 draws a focused framed control and an invalid one by turning its frame
heavy. An ASCII theme has no heavy line. Text field `lg` (0035) and Fieldset
(0127) need an answer before they are built. Raised by the Frame polish (0129).

## Options

- `#` and `=` for a heavy ASCII frame
- Keep `-|+` and signal with an attribute (bold, reverse on the title)

## Decision

**Keep `+-|` and draw them bold.** An ASCII frame's lines are letters the
font draws (`ASCII stays letters`, concept section 5), and bold is the only
weight a font has. A frame that goes heavy, for focus (`border.focus`) or for
invalid (`border.danger`), keeps its characters and their cells and turns
bold; its colour and the error row's mark carry the rest, as everywhere.

`#` and `=` were the other option. They change the characters, so a frame
reads differently in copied text and in a text snapshot, and `=` is a double
line in most ASCII art, not a heavy one.

Built in `fieldFrameBuffer` (Text field, 0035, the first framed control):
`Attr.bold` on the frame's cells when it is heavy under the `ascii` set.
Recorded in docs/concept.md section 9, under the state table.

## 2026-10-03

Decided by the CTO on Text field's build: a heavy ASCII frame keeps +-| and goes bold. fieldFrameBuffer sets Attr.bold on the frame's cells when it is heavy under the ascii set; Text field's Ascii story and test/text-field.test.ts prove it, and concept.md section 9 records it under 0118's table.

## Result

A heavy frame under an ASCII theme keeps its `+-|` and draws them bold. Built in `fieldFrameBuffer` with Text field (0035), the first framed control, and recorded under the state table in docs/concept.md section 9.

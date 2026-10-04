---
id: 215
uid: 7964f4d8-ca91-45ae-bc32-e7caf8177208
title: Decide what a solid control draws when the system colour pair is weak
type: decision
status: done
milestone: primitives
assignee: Oddur Sigurdsson
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
priority: p2
layer: css
effort: s
---

## Context

Firefox's emulated forced-colours palette pairs HighlightText `#fff` with
Highlight `#3399ff`, 2.94:1, and a solid button is drawn in that pair. Known
entry `firefox-forced-highlight` (0124).

## Options

- Ours to fix: draw solid controls in CanvasText/Canvas, which forced colours guarantee.
- The reader's palette to own: forced colours is the reader's choice of colours.

## Decision

Decided 2026-10-03. **Ours to fix: under forced colours, a solid control is
reverse video in the reader's own pair: CanvasText ground, Canvas text.**

- Highlight and HighlightText are the *selection* pair. Nothing in CSS or in
  any platform promises that pair reads as text. Firefox's emulated palette
  pairs them at 2.94:1, and a Windows theme is free to do worse. We borrowed
  them for fills because they were "the one filled pair the palette has". That
  was a convenience, not a meaning.
- CanvasText on Canvas is the pair the reader chose to read everything in, so
  its reversal reads exactly as well as their body text does, in every
  forced-colours palette there is. It is still entirely the reader's colours:
  we pick which of their colours a fill uses, not new ones.
- It is the grid's own answer already. A filled thing is reverse video
  everywhere else: the fill Button (0033), bg.inverse under forced colours
  (0181), focus on a filled control, and increased contrast (0065). A solid
  control now does under forced colours what it does everywhere.
- Highlight stays where it means what it says: `ansi.selection`.

The "reader's palette to own" option was turned down. Forced colours is the
reader's choice of *colours*, not of which of them we pair. Choosing a pair
the reader never promised would read, when one they did promise is available,
is our mistake, not theirs.

## Consequences

Every `bg.*.solid` and `solid-hover` is CanvasText under forced colours, and
every `fg.on-*` is Canvas. Solid controls of different intents look alike
there, as they should. Under forced colours meaning is carried by marks and
text (0118), never by which system colour a fill happens to be. The known
entry `firefox-forced-highlight` goes, because nothing is left for it to
excuse.

## Result

Under forced colours a solid control is reverse video in the reader's own pair: every bg.*.solid and solid-hover is CanvasText, and every fg.on-* is Canvas. It is not Highlight/HighlightText, the selection pair, which nothing promises reads; Firefox's emulation gives it 2.94:1. Highlight stays for selection.

# Glyphs

On a character grid the chrome is text, so the characters are design decisions:
a theme that wants rounded corners or plain ASCII changes tokens, and no
component changes at all.

## Border sets

Five sets, each drawn here by the engine as a frame with a divider. The divider
meets the sides without anyone drawing a tee: the seams are worked out, not
written.

<!-- part: border-sets -->

A theme names its set with its `borderSet` input. Under `ascii`, every glyph the
theme has is ASCII, the marks and blocks included, for a terminal or a font that
has nothing else.

## The junction table

A border is not stored as characters. Each cell holds four edge weights, north,
east, south and west, each `none`, `light`, `heavy` or `double`, and the
character is looked up from them at the very end. Drawing two lines over each
other merges the weights on the cells they share, the heavier side winning, so
the seam is right whatever was drawn first.

<!-- part: junctions -->

Unicode has no character for every combination. A double line meeting a heavy
one has none, so the engine draws the nearest that exists, one weight down,
and the cell strokes what that character says.

The lines themselves are drawn by the cell, not the font. A font's `│` is as
tall as the font, not as tall as the row, so it stops short at some densities
and overlaps at others. The engine gives each line its weights, the stylesheet
draws a stroke from the middle of the cell to each side, and the neighbour draws
the rest. The character stays in the page, so copying a frame gives you the
frame as text.

## Marks

State is never carried by colour alone (see [colour](../colour/)), so it is
carried by an attribute or by a mark in a cell kept for it. These are the marks,
in both repertoires:

<!-- part: marks -->

And the blocks, for fills, meters and the scrollbar's thumb:

<!-- part: blocks -->

## Wide characters, combining marks and emoji

A character is not always a cell. Han and the other East Asian wide scripts take
two; a combining accent takes none, and sits on the letter before it. The
engine measures text by grapheme, so a title or a label in any of them lands on
whole cells, and the frame around it still closes:

<!-- part: wide -->

The page draws those characters in whatever font has them, which is rarely
the monospace one. The engine still gives each its cells, so the columns after
them stay where they should, even when the glyph itself is a little narrower or
wider than the two cells it is given.

**Emoji are left out.** How wide an emoji is depends on the font and the
platform: one cell in one browser, two in the next, something in between in a
third. The engine counts the emoji blocks as two cells, but no font promises to
agree, so the system does not use them and does not try to make them fit.

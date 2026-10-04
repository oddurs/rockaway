---
'@rockaway/tokens': minor
'@rockaway/css': minor
---

Increased contrast, answered the grid way rather than with a third palette (cairn 0065). It applies under `prefers-contrast: more`, unless the page has chosen. `data-rk-contrast="more"` asks for it on any element, and `data-rk-contrast="standard"` keeps an element out. The same palette is read differently:

- muted text and the dim attribute become the foreground;
- coloured text takes the bright slot;
- a filled control is reverse video;
- every edge steps up a weight;
- strokes are heavier: light 0.12em and heavy 0.22em on a glyph screen, 2px and 3px on a ruled one;
- the focus ring is 3px;
- `@rockaway/css` strikes disabled controls through, so disabled never rests on dimness alone.

Nothing moves a cell.

The contrast gate checks every theme in both contrasts, holding text to 7:1 in `more`. Where a bright slot fell short of that, the palette is fitted, so the bright colours are a little further from the ground in places; the generator prints each move. DTCG gains a `contrast` modifier (`contrast.standard.tokens.json` and `contrast.more.tokens.json`), and the stroke weights move into it from `base.tokens.json`. `ContrastResult` gains `contrast`, and `minimumIn` gives a pair's minimum in a context.

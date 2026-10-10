# Accessibility

A terminal has no accessibility tree. The web does, and keeping it is why the
system draws on the DOM instead of a canvas: a screen reader hears a button,
not `┌────┐`. Chrome is decoration, hidden from assistive technology; the
content is ordinary HTML that happens to land on whole cells. No accessible name
ever contains a glyph.

## What is tested

Every component's stories run as tests in a real browser, and after every story
the workbench checks, in light and dark, at every density:

- **axe**, for the rules a machine can check: names, roles, states, and
  contrast against the real backgrounds. A violation fails the build.
- **Conformance**, that every box is a whole number of cells at the screen's
  [strictness](../strictness/) level.
- **Continuity**, from a real screenshot, that every line drawn by the cell
  reaches its edges and meets its neighbour, at every density and again at
  200% zoom.
- **Target size**, that a control is big enough to hit.

In a browser with **forced colors** on, the way Windows High Contrast runs, the
semantic tokens map to the reader's system colours, lines draw in their text
colour, and reverse video stays reverse. Forced-colors stories run there and
nowhere else.

Then the things a machine checks only in part. Every component is held to
working **by keyboard alone**, with focus always visible, and its keyboard map is
part of its metadata. Behaviour comes from React Aria, which is where the roles,
the keyboard handling and the announcements come from, rather than being
written again here. **A screen-reader pass**, with VoiceOver on macOS and on
iOS, is part of the review before the site launches; what it finds will be
recorded and fixed.

State never depends on colour: an attribute or a mark carries it too, so it
reads in greyscale, to someone who cannot tell red from green, and in forced
colors.

## Where it is thin

Written down so it is a known limit rather than a later surprise.

- **Paint cost is unmeasured at scale.** A dense full-page frame is a lot of
  elements, each vertical stroke and corner a cell of its own. Nobody has
  measured it on a slow phone yet.
- **A junction Unicode lacks is drawn as the glyph that stands in for it.** A
  double line meeting a heavy one is drawn one weight down, and where that meets
  an undemoted neighbour the line steps, as it would in a font.
- **Lines need the stylesheet.** Without `@rockaway/css`, a line is the font's
  character again: readable, but meeting its neighbour only by coincidence.
- **Wide and combining characters.** The engine measures by grapheme and gives
  wide scripts two cells, but emoji width is a lottery across fonts, so emoji
  are excluded by policy rather than solved. A grapheme wider than the line gets
  a line of its own.
- **`1ch` assumes the font is monospace.** A fallback that is not will measure
  wrong, which is why the cell is measured and the site ships its font with a
  fallback of the same width.
- **A static page has no measured screen.** Without JavaScript a page still has
  its text, but a screen's exact fit to its box is measured in the browser.
- **The default density does not yet meet the WCAG 2.2 target size** for
  adjacent controls. It is decided that it will; until the new line box ships,
  rows of controls that touch are smaller than 24px at `normal`.

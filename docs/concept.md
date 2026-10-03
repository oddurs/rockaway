# The concept

How a terminal UI becomes a web page, and why it is built this way rather than
the three more obvious ways.

The [README](../README.md) says what rockaway is. This says why, and states the
rules a component is held to. Decisions referenced as `0111` are cairn items —
`cairn show 111` for the full record.

---

## 1. A frame is data, not characters

Every border is **four edge weights on a cell**: `{north, east, south, west}`,
each one of `none | light | heavy | double`. The character is looked up from
those weights at the very end.

Nothing in the system ever stores `┌`.

```ts
// packages/grid/src/junction.ts
mergeEdges(a, b)   // the heavier of each side wins
glyphFor(edges, set)  // → '┌' | '┬' | '╋' | …, from the inverted U+2500–U+257F table
```

This is the load-bearing decision (`0079`). Because a cell's appearance is a
pure function of the edges that have accumulated on it, **drawing commutes**:
draw a box over a line or a line over a box, and the seam is the same `┬`. There
is no z-order, no seam-patching pass, and no "did I draw the divider before the
panel" class of bug — the thing that makes hand-drawn ASCII layouts miserable to
maintain simply cannot happen. The merge is tested as commutative,
associative and idempotent, not assumed to be.

Fallback is by weight, not by name: a `double` junction that has no glyph falls
back to `heavy`, then to `light`. A border set that cannot express a seam
degrades instead of printing a hole.

Titles commute too (`0175`). A title, or a label sunk into a rule, is text over
border cells, and a rule crossing that edge would otherwise take a letter or
lose its tee depending on which was drawn last. So a label is recorded rather
than written, and set into its edge when the draw pass closes, once every edge
is known: it owns its cells, stops short of the first junction in its edge,
and truncates with the theme's ellipsis — `┌ si… ─┬─────┐`, whichever order.

## 2. The cell is `1ch` × `1lh`

Across, a cell is the font's advance width. Down, it is the line box, which the
density context sets.

Tokens do not carry lengths. They carry **counts**, and `packages/css/src/cell.css`
is the only place in the system where a count becomes a length:

```css
--rk-cell-width: 1ch;
--rk-cell-height: 1lh;
--rk-x-2: calc(var(--rk-space-2) * var(--rk-cell-width));
```

A component writes `padding: var(--rk-y-1) var(--rk-x-2)` and is on the grid
without arithmetic. Density is then a genuine multiplier on the grid rather than
a second set of hard-coded lengths — which is also why DTCG's refusal to accept
`ch` and `lh` as dimension units turned out to improve the design rather than
constrain it.

## 3. Four routes to a TUI on the web. We take the fourth

| Route | Examples | What it costs |
| --- | --- | --- |
| Paint the grid to canvas or WebGL | xterm.js's canvas and WebGL renderers, GPU terminal emulators | **The DOM.** No accessibility tree, no native focus, no text selection, no forced-colors, no screen reader. Perfect fidelity, zero platform. |
| Type box characters into HTML | most "terminal aesthetic" sites | **A costume.** Breaks on wrap, zoom, selection and i18n, and has no interaction model at all. |
| Stream a real TUI into a page | textual-web, ttyd, gotty | **A terminal in a page, not a page.** Needs a server, and pays latency on every keystroke. |
| Keep the DOM, constrain the geometry | rockaway | **Paint cost,** and a grid you have to hold yourself to. |

The full argument is `0111`. The short version: a terminal's constraint is worth
adopting, a terminal's *rendering model* is not, because the web's rendering
model is the accessible one and we would be giving up the only thing the browser
does better than a terminal.

So: semantics stay in the DOM, and only the geometry is constrained.

## 4. Two layers

`Screen` (`packages/react/src/screen.tsx`) measures its container in cells, asks
the caller to draw a buffer that size, and hands the buffer to a painter:

```
┌ Screen ─────────────────────────────────────┐
│  chrome layer   painted, aria-hidden        │  ← ┌─┐ │ └─┘ ├ ┬ and cell styles
│  content layer  real elements, on top       │  ← <button>, <input>, <a>
└─────────────────────────────────────────────┘
```

A screen reader hears a button, not `┌────┐`. **No accessible name ever contains
a glyph.** The chrome is decoration in the technical sense and is marked as such;
the content is ordinary HTML that happens to land on whole cells.

Measurement is a 50-character probe (`cell-metrics.ts`), one `ResizeObserver`
batched into a rAF, and `--rk-cell-width` / `--rk-cell-height` set on the host.
Fonts load late and zoom changes; the cell is measured, never assumed.

## 5. The font supplies letters; the cell supplies geometry

A buffer is a description. What renders it is swappable:

| Output | What it is | For |
| --- | --- | --- |
| `paintGlyph` | whole cells: letters by the font, lines and blocks by the cell, stroked like type | the default |
| `paintRule` | the same cells, stroked as hairlines | crisp rules, for readers who want them |
| `toText` | a plain string | snapshots, docs, `README` diffs, server rendering |
| `toAnsi` | escape sequences | the same frame in a real terminal |

One geometry, four outputs, and **a painter never invents geometry**: it reads
the buffer and draws. A screen therefore measures the same in cells whichever
painter drew it — which is what makes a text snapshot a valid test of the
painted page.

### Why the font cannot draw a line

A box only reads as a box if its lines meet, and a font's `│` is as tall as the
font says, not as tall as the cell. Measured in the workbench (system mono,
16px), it has 21px of ink at every line height:

| density | cell | font `│` | |
| --- | --- | --- | --- |
| dense | 16px | 21px | bleeds 3px into the row above and 2px into the row below |
| normal | 20px | 21px | meets, by coincidence of this font |
| airy | 24px | 21px | a 3px gap between rows |
| touch | 32px | 21px | an 11px gap |

Density *is* the line box (`0074`), so the line box will never match the font.
The same is true of block elements — a scrollbar thumb of `█` falls apart into
separate blocks — and of any background on an inline span, which paints the
font's content area rather than the cell, so reverse video stripes.

So the principle, decided in `0116`:

> **The font supplies letters. The cell supplies geometry.**

It is what kitty, WezTerm, Alacritty and Ghostty do, for exactly this reason:
they draw box drawing and block elements themselves instead of trusting the
font. Here that means:

- **Every painted cell is a whole cell.** A row is a line of runs, each exactly
  one cell tall and as many cells wide as it holds. Nothing painted takes its
  height from the font, so a background fills its cell and reverse video is a
  solid block.
- **Box drawing and block elements are geometry, in the engine.**
  `packages/grid/src/shape.ts` describes every glyph the junction table can
  produce, and every block element, as rectangles and arcs measured from the
  cell's own edges and centre. Pure data: a stylesheet or a canvas could read
  it.
- **A stylesheet generated from it draws them.** `packages/css/src/shapes.css`
  is written from those shapes at build time and committed; a test fails if it
  is stale. A cell holding `┬` says so — `data-rk-shape="box-0111"`, its
  weights north, east, south, west — and its rule draws a stroke from each
  weighted edge in to the centre as background layers on the cell's own box.
  The same table that picks the glyph decides how it is stroked. Nothing is
  injected at runtime, so a server-rendered page is drawn by the same CSS.
- **The character stays.** It is in the cell, transparent, so copying a screen
  gives `┌──┐`, find in page finds it, and every text snapshot is unchanged.
- **One renderer, two stroke styles.** `paintGlyph` and `paintRule` write the
  same runs into the same cells; only the stroke weights differ, and those are
  tokens — `stroke.glyph.*` as a fraction of the font size, weighted like the
  type beside it, and `stroke.rule.*` as hairlines. A theme can change how heavy
  a line is without touching a component. (The rule painter used to position an
  element per stroke and draw no characters at all; it is gone.)
- **Forced colors and print keep the lines.** Forced colors drops background
  images that are not URLs, which is every stroke, so a stroked cell opts out
  of the adjustment and strokes in `CanvasText`. Printing drops backgrounds
  unless told otherwise, so every run says `print-color-adjust: exact`.
- **ASCII stays letters.** `+--+` never joined in a terminal either; drawing it
  as lines would only make it the single set. A theme whose border set is
  `ascii` draws its whole repertoire in ASCII (`0119`) — a scrollbar of `#` and
  `.`, a cursor of `>` — so under it there is nothing for the cell to draw: the
  font draws every character, and the cells are still whole cells, so
  backgrounds and reverse video still fill them.

### The half-stroke

The geometry's one subtlety, learned the hard way (`0110`). An edge is a
**half-stroke from the centre of its cell toward that side** — *not* a border on
the cell's box:

```
   border-on-box            half-strokes from centre
   ┌──┐┌──┐┌──┐             ─────────────────
   └──┘└──┘└──┘             one continuous run
   ticks, gaps, a dashed    corners meet in the middle,
   mess at every seam       exactly where ┌ puts it
```

Half-strokes are what let two neighbouring cells fuse into one line, and the
shapes are built so that the ink where a line crosses a cell's edge depends
only on that side's weight: a light line crosses every edge in the same place,
whatever glyph is on either side of it. So **lines meet by construction** — and
the engine's tests prove it for every pair of glyphs at once, at every cell
proportion we draw at, before a browser is involved.

Within a cell, the strokes stop where the junction needs them to: a stroke runs
past the centre far enough to cover whatever crosses it, so a corner is closed
and a tee has no notch; a double line's two strokes turn into each other, inner
to inner and outer to outer, so `╔` is two nested corners and `╬` is four.
Rounded corners are quarter circles, not ellipses, so the stroke keeps its
width all the way round, and their radius is a stroke short of half the cell, so
the corner always ends in a piece of straight stroke at the cell's edge and
meets its neighbour exactly as a straight line does.

What only pixels taught, because the browser snaps every background layer to
whole CSS pixels on its own, whatever box it is in:

- A layer that ends exactly on a cell's fractional edge can lose that cell's
  last column of ink. Layers that reach an edge are drawn a pixel past it, and
  the cell's own box clips them back.
- Positions are lengths from the cell's start, never percentages: a percentage
  aligns a different point of each layer, so two layers that start together
  would snap apart and a corner would grow a nub.
- An arc is a gradient, which is not snapped, so it is placed on whole pixels
  itself and aimed at where the straight strokes were *drawn*, not where they
  were asked to be. At a hairline's width the difference is a visible step.
- The measured cell is rounded to the browser's layout unit (1/64 px). A run of
  eight cells and eight runs of one would otherwise round differently, and the
  same column would land in different places on different rows.

Worth remembering when adding a painter: **the geometry is right when
neighbours join without being told they are neighbours**, and only a picture of
the page proves it.

## 6. Strictness is a dial, and exceptions are declared

A grid nobody can break is a grid people quietly abandon (`0072`). Three levels
— `strict`, `standard`, `loose` — and one escape hatch:

```html
<div data-rk-offgrid="the logo is 37px and the brand team won">…</div>
```

`checkConformance` asserts that every box inside a screen measures a whole
number of cells, in both directions, at every density and in every theme. It
runs on every story via an `afterEach`. Anything off-grid without a reason
fails; anything with one is printed in the report, grouped by reason and
counted, so a page can say "3 exceptions, 2 reasons". An empty reason is not a
reason: `data-rk-offgrid=""` fails on its own (`0123`).

The level is declared with `data-rk-conformance` on the screen or any
ancestor, and otherwise comes from the theme's `--rk-conformance` token:

| Level | What the check holds to the grid |
| --- | --- |
| `strict` | every box, in whole cells; and the glyph painter only |
| `standard` | every box, in whole cells, except half a cell inside a control (`data-rk-control`); either painter |
| `loose` | screens and panes (`data-rk-pane`) in whole cells; anything inside a pane is free |

The level belongs to the screen, not to a box in it, so a component cannot
loosen the app it sits in. The workbench runs at `standard`, with a story
pinned at each level.

The deal is not "never break the grid". The deal is **breaking it quietly is
what's forbidden** — exceptions become countable instead of accumulating.

The screen's own box is exempt: the page decides how much room a screen gets,
and the grid governs what is drawn inside it.

## 7. The buffer is the test oracle

Because the engine is pure and paints to text, the test for "does this look
right" is a picture of it:

```diff
- │ [ Publish ]  [ Cancel ]             │
+ │ [ Publish ]  [ Preview ]  [ Cancel ]│
```

This is ordinary practice in terminal-land and rare on the web, and it is most
of why the grid package's tests are readable. A component's snapshot is its
documentation as much as its test. `toAnsi` means you can `cat` one in your own
terminal and see the component.

Three tests, layered:

1. **Text snapshots** — the geometry, in the pure engine, no browser.
2. **Grid conformance** — the boxes, in a real browser, at every density.
3. **Continuity** — the pixels, because the half-stroke bug (`0110`) and the
   font's `│` (`0116`) both passed 1 and 2 while the page was wrong.

`checkContinuity` (in `@rockaway/react/testing`) takes a real screenshot of
every painted layer and reads it. For every cell that draws its own shape it
asks whether the ink reaches each edge the shape reaches, in the cell's own
outermost pixels; whether there is none on an edge it does not reach; whether
two neighbours that share an edge cross it in the same pixels, with nothing
unpainted between them; and whether every stroke joins the rest of its glyph
inside the cell. A run with a background has to fill its top and bottom rows.
The screenshot is the caller's, because only a test runner can take one — under
Vitest, `page.screenshot({ element, save: false })`.

Like conformance, it runs after every story. The workbench also holds it to a
matrix: every border set and a junction-heavy frame, block elements and reverse
video, with both painters, at all four densities; across font sizes and
sub-pixel offsets, standing in for other fonts and for wherever a page puts a
screen; and all of it again in a browser with two device pixels to every CSS
pixel, which is what 200% zoom does to the drawing, and in a browser with forced
colors on. Because the browser snaps to whole CSS pixels, an edge counts as
reached within half a CSS pixel of it, and across a join every line between the
two cells has to be inked. A story that hands the shapes back to the font shows
the check failing, so a pass means something.

## 8. A theme is a terminal theme

The palette is the **ANSI 16**, generated in OKLCH with a contrast gate every
pair has to pass in both modes. It exports to ghostty, kitty, alacritty and
iTerm2, and imports back, with the round trip asserted.

Not a gimmick: it means a rockaway theme is a thing our readers already have,
already curate, and already have opinions about. Sixteen colours is also a real
constraint on component design — state cannot be carried by hue alone, which is
why attributes (bold, dim, reverse, underline) and marks carry it too, and why
the system passes forced-colors mode without special-casing.

## 9. States are one vocabulary

Every state is drawn one way, in every component (decision `0118`), and a
component's metadata names the row rather than describing it again. The table
is also data: `stateVocabulary` in `@rockaway/react/metadata`.

**States never change geometry.** A state may change attributes, colour, border
weight, or a glyph in a cell that is reserved in every state. It never adds or
removes a cell, because a control that moves its neighbours when it is hovered
is not on a grid. A test fails any rule keyed on a state that sets a size.

| State | Source | Drawn as | Without colour |
| --- | --- | --- | --- |
| hover | `data-hovered` | underline on the label | underline |
| focus, unframed control | `data-focus-visible` | the focus ring: an outline that costs no cell | outline |
| focus, framed control | `data-focus-visible` | the frame goes `heavy` in `border.focus` | weight |
| pressed | `data-pressed` | reverse video; a filled control reverses back | reverse |
| cursor (focused row in a collection) | `data-focused` | the cursor mark in the row's reserved mark cell | mark |
| selected | `data-selected` | reverse video; in multi-select also the check mark in a second reserved cell | reverse, mark |
| checked / indeterminate | `data-selected`, `data-indeterminate` | check or dash between the control's delimiters | mark |
| expanded / collapsed | `data-expanded` | the expanded or collapsed mark | mark |
| disabled | `data-disabled` | dim (`fg.disabled`), default cursor; `GrayText` in forced colors | dim is an attribute |
| invalid | `data-invalid` | the cross mark before the message, `fg.danger`; framed controls go `heavy` in `border.danger` | mark, weight |
| required | `data-required` | `*` after the label, `aria-hidden` (the semantics are `aria-required`) | mark |
| read-only | `data-readonly` | the value without the control's track or ground | ground removed |
| current (navigation) | `aria-current`, reflected as `data-current` | bold plus the cursor mark | bold, mark |
| pending | `data-pending` | the spinner in a reserved cell | glyph |
| placeholder | `:placeholder-shown` | dim | dim |

`danger` is a variant, not a state: `fg.danger` plus `!` in the reserved mark
cell. Messages, such as an error under a field, are content and may add rows.

The cursor and the selection are two signals, and List is where they meet: in
a multi-select list the keyboard's row and the chosen rows are told apart in
text, in greyscale and in forced colors. Reverse video swaps an element's own
figure and ground. In forced colors that means the reader's text and canvas
swapped, so it is never drawn as two halves that both collapse to the canvas.

---

## What we borrowed, and from whom

Being honest about this is worth more than a claim of novelty.

- **Buffer of cells, immediate-mode draw, integer rects.** Standard TUI
  architecture — Ratatui and notcurses work this way. Our twist is that the
  buffer is immutable (`draw(fn) → new buffer`), so a frame is a value.
- **The `1ch` × `1lh` grid on the web.** Oskar Wickström's *The Monospace Web*
  is the prior art. We go further by making tokens counts and localising the
  conversion to one file.
- **Junction lookup tables.** Diagram tools have done this for years — Monodraw,
  ditaa, asciiflow. Weighted per side, with a merge proven commutative, is where
  we go past them.
- **Declared exceptions with a machine-checkable reason.** Borrowed from linting
  and type-checking culture, not from either TUI or web design systems.
- **React Aria** for behaviour. A TUI is keyboard-first, which is exactly what
  React Aria is best at. We do not hand-roll focus or key handling.

- **Drawing box drawing instead of trusting the font.** kitty, WezTerm,
  Alacritty and Ghostty all do it, for the reason in section 5. Doing it in CSS
  from a stylesheet generated off the junction table is ours.

Ours, as far as we know: painting as a strategy over one geometry, the
half-stroke, grid conformance and continuity as tests, and
theme-is-a-terminal-theme.

## Where it is thin

Written down so it is a known limit rather than a later surprise.

- **Paint cost is unmeasured at scale.** Both painters coalesce same-style runs,
  and a line across the cell is one run however long: an 80×24 frame is 72
  runs. But every vertical stroke, corner and tee is a cell of its own with up
  to eight background layers. `0113` measures it, and a canvas painter stays
  available precisely because painting is a strategy — the shapes are data it
  could read — but nobody has run the numbers yet.
- **A junction Unicode lacks is drawn as the glyph that stands in for it.** A
  double line meeting a heavy one has no glyph, so the engine draws it one
  weight down (`0079`), and the cell strokes what the character says. Where
  that meets an undemoted neighbour the line steps, just as it does in a font.
- **The cell is rounded to the layout unit.** So that a run of cells and the
  same cells one by one land on the same pixels, the measured cell is rounded
  to 1/64px. A font's advance is not, so a long run of text can sit up to half
  a pixel off the cell grid by its far end. Nothing joins to text, so nothing
  breaks; a canvas painter would not have the problem.
- **Lines need the stylesheet.** Without `@rockaway/css` a shaped cell is an
  ordinary cell with its character in it, drawn by the font: legible, but back
  to meeting by coincidence.
- **Wide and combining characters.** `charWidth` handles the wide ranges and
  `Intl.Segmenter` gives us graphemes, but emoji width is a lottery across fonts
  and we exclude them by policy rather than by solving it. A grapheme wider than
  the line gets its own line: a documented exception, not a fix.
- **`1ch` assumes the font is monospace.** A fallback that is not will measure
  wrong. We ship the metric rather than trusting a stack.
- **Three painters is not four.** Server rendering uses `toText`; a static page
  with no JavaScript gets chrome, but `Screen`'s measurement, and therefore an
  exact fit, needs the client.

## The contract a component is held to

The `0111` rules, as the checklist a review can quote. Every component item in
cairn carries these as acceptance criteria, and the `component` template in
`cairn.toml` issues them to new ones.

1. **Sized in cells, drawn by the frame engine.** No box characters written by
   hand, anywhere, ever.
2. **Both painters render it identically,** measured in cells.
3. **Chrome is `aria-hidden`;** the accessible name never contains a glyph.
4. **Behaviour comes from the behaviour layer.** No hand-rolled focus or
   keyboard logic.
5. **Styled from `data-*` state and semantic tokens only.** A component that
   needs a reference token is a missing semantic.
6. **Ships a text snapshot,** which is its documentation as much as its test.
7. **Conforms at `strict`,** or declares its exception with a reason.
8. **Operable by keyboard alone,** and usable with a finger at touch density.
9. **State reads without colour:** an attribute or a mark carries it too.
10. **axe passes** in light, dark and forced-colors.

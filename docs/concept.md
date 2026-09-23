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

## 5. Painting is a strategy

A buffer is a description. What renders it is swappable:

| Painter | Output | For |
| --- | --- | --- |
| `paintGlyph` | box-drawing characters in coalesced spans | the default — it is literally text |
| `paintRule` | positioned CSS hairlines | crisp lines at any zoom, for readers who want them |
| `toText` | a plain string | snapshots, docs, `README` diffs, server rendering |
| `toAnsi` | escape sequences | the same frame in a real terminal |

One geometry, four outputs. In a real terminal only the first is *possible*; on
the web we have subpixel borders, so the identical TUI can render with real 1px
rules that stay sharp on a retina display instead of a font's approximation of a
line. This is the part with no prior art we know of, and it is the reason the
system is not a costume.

**The rule that makes it safe: a painter never invents geometry.** It reads the
buffer and draws. A screen therefore measures the same in cells whichever
painter drew it — which is what makes a text snapshot a valid test of the
CSS-painted page.

### The half-stroke

The rule painter's one subtlety, learned the hard way (`0110`). An edge is a
**half-stroke from the centre of its cell toward that side** — *not* a border on
the cell's box:

```
   border-on-box            half-strokes from centre
   ┌──┐┌──┐┌──┐             ─────────────────
   └──┘└──┘└──┘             one continuous run
   ticks, gaps, a dashed    corners meet in the middle,
   mess at every seam       exactly where ┌ puts it
```

Half-strokes are what let two neighbouring cells fuse into one line. Every unit
test passed with borders-on-boxes; only a screenshot caught it. Worth
remembering when adding a painter: **the geometry is right when neighbours join
without being told they are neighbours.**

## 6. Strictness is a dial, and exceptions are declared

A grid nobody can break is a grid people quietly abandon (`0072`). Three levels
— `strict`, `standard`, `loose` — and one escape hatch:

```html
<div data-rk-offgrid="the logo is 37px and the brand team won">…</div>
```

`checkConformance` asserts that every box inside a screen measures a whole
number of cells, in both directions, at every density and in every theme. It
runs on every story via an `afterEach`. Anything off-grid without a reason
fails; anything with one is printed in the report.

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
3. **Screenshots** — the pixels, because the half-stroke bug proved 1 and 2 can
   both pass while the page is wrong.

## 8. A theme is a terminal theme

The palette is the **ANSI 16**, generated in OKLCH with a contrast gate every
pair has to pass in both modes. It exports to ghostty, kitty, alacritty and
iTerm2, and imports back, with the round trip asserted.

Not a gimmick: it means a rockaway theme is a thing our readers already have,
already curate, and already have opinions about. Sixteen colours is also a real
constraint on component design — state cannot be carried by hue alone, which is
why attributes (bold, dim, reverse, underline) and marks carry it too, and why
the system passes forced-colors mode without special-casing.

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

Ours, as far as we know: painting as a strategy over one geometry, the
half-stroke, grid conformance as a test, and theme-is-a-terminal-theme.

## Where it is thin

Written down so it is a known limit rather than a later surprise.

- **Paint cost is unmeasured at scale.** The glyph painter coalesces same-style
  runs into spans; the rule painter emits one node per ruled cell plus one per
  stroke. A dense full-page frame is a lot of DOM. `0113` measures it, `0114`
  coalesces runs, and a canvas painter stays available precisely because
  painting is a strategy — but nobody has run the numbers yet.
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

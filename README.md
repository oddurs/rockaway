# rockaway

**A TUI design system for the web.** Everything sits on a character grid: one
cell wide, one row tall, no halves.

Terminals have been doing a lot with a little for fifty years. The constraint
is the point — a grid you cannot fall off, screens you can diff as text, and a
palette your reader already has. rockaway takes that model seriously on the
web, where the reader might be on a phone, at 400% zoom, or using a screen
reader.

[**The concept**](docs/concept.md) explains how a TUI becomes a web page: frames
as data, two layers, four painters over one geometry, and the rules that follow.

> [!NOTE]
> Pre-release: nothing is published yet. The token pipeline and the CSS layers
> are built; the frame engine is next. The [roadmap](ROADMAP.md) is the truth.

## What it is

- **An integer geometry engine.** Boxes, junctions, text measurement and layout, all in whole cells, with no DOM in it. It runs in a browser, in Node, and in a test.
- **Four painters over one geometry.** Characters (`┌─┐`), CSS hairlines, ANSI escapes, or plain text. The same screen, four outputs, one source of truth.
- **Tokens as data.** DTCG sources, an ANSI-16 palette generated in OKLCH, and a contrast gate that every pair has to pass, in both modes.
- **Components on React Aria.** Keyboard-first, because that is what a TUI is, and what React Aria is best at.

## Strictness is a dial

A grid nobody can break is a grid people quietly abandon. Pick the level your
app wants:

| Level | Layout | Frames | Spacing |
| --- | --- | --- | --- |
| `strict` | whole cells | glyphs only | whole cells |
| `standard` | whole cells | glyphs or CSS rules | whole cells, half a cell inside controls |
| `loose` | whole cells for panes | any painter, radius allowed | free inside a pane |

And when you break the grid, say so:

```html
<div data-rk-offgrid="the logo is 37px and the brand team won">…</div>
```

The conformance test fails on anything off the grid that does not carry a
reason, and prints the ones that do. Exceptions become countable instead of
accumulating quietly.

## What you get, and what you give up

**Given up:** corner radii, drop shadows, arbitrary sizes, a type scale,
photographs, emoji (their width is a lottery), and easing curves.

**Gained:** chrome that is text, emphasis as attributes (bold, dim, reverse,
underline), sixteen colours everybody already themes, frames on a tick, and
two tests that a pixel system cannot run:

- **Grid conformance** — every box measures a whole number of cells, in every theme and density.
- **Text snapshots** — a component's test looks like the component.

```diff
- │ [ Publish ]  [ Cancel ]             │
+ │ [ Publish ]  [ Preview ]  [ Cancel ]│
```

## On a phone

The cell comes from the font, in `rem`, so browser zoom and the reader's font
size work untouched. Touch does not get a second layout: it gets a bigger
cell — `touch` density puts a one-row control at about 44px without moving a
single coordinate. Layout responds to how many cells it has, at 40, 60, 80 and
120 columns, the widths terminals have always used.

## Packages

| Package | What it is |
| --- | --- |
| `@rockaway/grid` | The engine: cells, boxes, junctions, text measurement, layout, painters |
| `@rockaway/tokens` | DTCG sources, the ANSI palette, cell metrics, glyph sets, the resolver |
| `@rockaway/css` | The CSS contract: cascade layers, reset, base, forced colors |
| `@rockaway/react` | Components, on React Aria |

The engine has no dependencies and no DOM. The tokens and the CSS are
framework-free. Only the components are React.

## Development

Node 24, pnpm 12.

```sh
pnpm install
pnpm storybook     # the workbench
pnpm check         # lint, typecheck, build, tests, roadmap
```

The roadmap and every decision live in the repository as Markdown, managed
with [cairn](https://github.com/oddurs/cairn): `cairn next` shows what is ready.
Architecture decisions are items too, with their context and consequences —
start with [why it is a TUI system](cairn/items), items 0070 to 0077.

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)

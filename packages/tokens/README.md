# @rockaway/tokens

Design decisions as data. Five theme inputs produce every token (cairn 0058);
theme, mode and density are runtime contexts, resolved through the DTCG
Resolver.

## The theme

[`themes/default.json`](themes/default.json) holds the five inputs and nothing else (a sixth, `weights`, is optional):

| Input | Values |
| --- | --- |
| `accentHue` | OKLCH hue, 0–360 |
| `neutralTemperature` | `cool`, `neutral`, `warm` |
| `typePairing` | `system`, `jetbrains`, `ibm-plex`, `berkeley` |
| `borderSet` | `single`, `double`, `heavy`, `rounded`, `ascii` |
| `conformance` | `strict`, `standard`, `loose` |
| `weights` (optional) | Any of `emphasis`, `raised`, `modal`, each a border set |

The default is set in IBM Plex Mono (`ibm-plex`), and so is every preset and
imported theme: a face with a true italic, so emphasis and comments are never
a slant the browser fakes. The tokens name the family; the app loads the font,
its italic included, for example from `@fontsource/ibm-plex-mono`. Until it
arrives the stack falls back to the system's monospace.

The others under `themes/` are presets, and `themes/terminal/` holds imported
terminal palettes, each with its source and its licence beside it.
`themeContexts` lists every theme with the modes it declares; `themes` and
`themeGlyphs` give each one's inputs and glyphs by name.

## Themes, modes and density on any element

Each is an attribute, and each works on any element, nested in any order:

```html
<html data-rk-theme="ink" data-theme="dark" data-density="normal">
  <aside data-rk-theme="solarized">…</aside>   <!-- Solarized, still dark -->
  <section data-theme="light">…</section>      <!-- ink, light -->
</html>
```

The default theme is in `tokens.css`. Every other is a stylesheet of its own,
loaded after it:

```css
@import '@rockaway/tokens/tokens.css';
@import '@rockaway/tokens/themes/ink.css';
@import '@rockaway/tokens/themes/dracula.css';
```

A theme carries its palette in both modes, and every colour is a
`light-dark()` pair over them, so a mode is only a `color-scheme`: that is
what lets the two nest freely. A theme with a single mode, like Dracula, pins
it. Chrome is drawn in JavaScript, so pair the attribute with
`<GlyphProvider glyphs={themeGlyphs.ink}>` from `@rockaway/react` for the
theme's border set and marks.

Increased contrast is a context too (cairn 0065). `prefers-contrast: more`
applies it to a page that has not chosen, `data-rk-contrast="more"` asks for it
on any element, and `data-rk-contrast="standard"` keeps an element out. It is
not a third palette: the same colours are read differently. Muted text becomes
the foreground, coloured text takes the bright slot, a fill becomes reverse
video, every line is a step heavier, the focus ring is thicker, and disabled is
struck through as well as dimmed. Text is held to 7:1 there, and nothing moves
a cell.

Text drawn in a theme's glyphs, like a component's snapshot, differs by
theme, and no stylesheet can redraw it. Render each drawing and mark it with
the themes it is for; `tokens.css` shows the one the nearest theme context
names, with no script:

```html
<figure data-rk-theme-only="default ice dracula">┌ files ─┐ …</figure>
<figure data-rk-theme-only="ink">╭ files ─╮ …</figure>
<figure data-rk-theme-only="phosphor">╔ files ═╗ …</figure>
```

`default` is the page with no `data-rk-theme`. An element that names no
theme in play is hidden, so list every theme across the set.

Every theme passes the contrast gate (cairn 0022, 0163) in every mode it
declares, in both contrasts. A palette that does not pass is fitted: a failing colour moves in
lightness, keeping its hue, until it does. `pnpm generate` prints every move,
and the theme's DTCG file records them.

## Use

```css
@import '@rockaway/tokens/tokens.css';
```

Every token is a custom property in `@layer rk.tokens`: `fg.muted` is
`--rk-fg-muted`. From TypeScript, `vars` maps each DTCG path to its `var()`:

```ts
import { vars } from '@rockaway/tokens';

vars['fg.muted']; // 'var(--rk-fg-muted)'
```

## Glyphs

A theme owns its characters (cairn 0119): the border set, the marks, the
blocks, the spinner and the control delimiters. `glyphsFor(inputs)` resolves
them, and `themeGlyphs` holds every preset's. A theme whose border set is
`ascii` draws everything in ASCII — `>` for the cursor, `#` and `.` for a
scrollbar — not just its boxes.
The `ascii` preset is that theme: a neutral palette for any terminal that can
be trusted with nothing past `~`, and the one to reach for when chrome has to
survive a paste anywhere.

With no shadows on a grid, a frame stands out by its weight (cairn 0247), and
the weights are glyphs too. `glyphs.weight` names the set for each reason:

| Weight | Drawn for | Default |
| --- | --- | --- |
| `emphasis` | A frame in a state that asks for attention: a focused or invalid field | `heavy` |
| `raised` | A frame above the page: a popover, a menu, a select's list | `heavy` |
| `modal` | A frame above everything: a dialog | `double` |

Under an ASCII theme all three are `ascii`, and bold carries the difference.
A theme sets its own in `weights`, within its repertoire: a Unicode theme
cannot draw a weight in ASCII, or the other way round.

The `--rk-glyph-*` properties are written from the same object, but components
do not read them: chrome is drawn into a buffer in JavaScript, possibly on a
server, so `@rockaway/react` passes the object down through `GlyphProvider`.

## Terminal themes

Every theme also ships for the terminal, in each mode it declares:
`@rockaway/tokens/terminal/{ghostty,kitty,alacritty,iterm2}/rockaway-<theme>-<mode>`.
The colours are the ones the web uses, fitted to the same contrast gate. An
imported theme's files open with where it came from, what fitting changed, and
its upstream licence in full.

## Tailwind

```css
@import 'tailwindcss';
@import '@rockaway/tokens/tokens.css';
@import '@rockaway/tokens/tailwind.css';
```

Utilities resolve to the same custom properties the components read, so
`bg-surface`, `text-muted` and `p-4` follow the mode and density contexts
without a rebuild. The adapter is generated; do not edit it.

## Generated DTCG

```sh
pnpm --filter @rockaway/tokens generate        # themes/ → dtcg/ → css/ and src/names.ts
pnpm --filter @rockaway/tokens generate:check  # fails if anything generated is stale
```

[`dtcg/`](dtcg), [`css/`](css) and `src/names.ts` are
committed so changes to the rules show up in review. Do not edit them by hand.
The tests fail if any of them is stale, and Terrazzo validates the DTCG.

| File | Holds |
| --- | --- |
| `rockaway.resolver.json` | How the files combine; `theme`, `mode` and `density` modifiers |
| `base.tokens.json` | Strokes and attributes |
| `theme.{name}.tokens.json` | A theme: its palette in both modes, its type and its glyphs |
| `mode.{light,dark}.tokens.json` | Which half of the palette `ansi.*` reads |
| `density.{dense,normal,airy,touch}.tokens.json` | Space and control sizes, one per `density` context |

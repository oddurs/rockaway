# @rockaway/tokens

Design decisions as data. Five theme inputs produce every token (cairn 0058);
theme, mode and density are runtime contexts, resolved through the DTCG
Resolver.

## The theme

[`themes/default.json`](themes/default.json) holds the five inputs and nothing else:

| Input | Values |
| --- | --- |
| `accentHue` | OKLCH hue, 0–360 |
| `neutralTemperature` | `cool`, `neutral`, `warm` |
| `typePairing` | `system`, `jetbrains`, `ibm-plex`, `berkeley` |
| `borderSet` | `single`, `double`, `heavy`, `rounded`, `ascii` |
| `conformance` | `strict`, `standard`, `loose` |

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

Every theme passes the contrast gate (cairn 0022, 0163) in every mode it
declares. A palette that does not pass is fitted: a failing colour moves in
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

The `--rk-glyph-*` properties are written from the same object, but components
do not read them: chrome is drawn into a buffer in JavaScript, possibly on a
server, so `@rockaway/react` passes the object down through `GlyphProvider`.

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

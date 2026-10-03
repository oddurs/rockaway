# @rockaway/tokens

Design decisions as data. Five theme inputs produce every token (cairn 0058);
mode and density are runtime contexts, resolved through the DTCG Resolver.

## The theme

[`themes/default.json`](themes/default.json) holds the five inputs and nothing else:

| Input | Values |
| --- | --- |
| `accentHue` | OKLCH hue, 0–360 |
| `neutralTemperature` | `cool`, `neutral`, `warm` |
| `typePairing` | `system`, `jetbrains`, `ibm-plex`, `berkeley` |
| `borderSet` | `single`, `double`, `heavy`, `rounded`, `ascii` |
| `conformance` | `strict`, `standard`, `loose` |

The others under `themes/` are presets: `themes` exports all of them by name.

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
pnpm --filter @rockaway/tokens generate        # themes/default.json → dtcg/ → css/ and src/names.ts
pnpm --filter @rockaway/tokens generate:check  # fails if anything generated is stale
```

[`dtcg/`](dtcg), [`css/tokens.css`](css/tokens.css) and `src/names.ts` are
committed so changes to the rules show up in review. Do not edit them by hand.
The tests fail if any of them is stale, and Terrazzo validates the DTCG.

| File | Holds |
| --- | --- |
| `rockaway.resolver.json` | How the files combine; `mode` and `density` modifiers |
| `base.tokens.json` | Font primitives |
| `palette.{light,dark}.tokens.json` | Palettes, one per `mode` context |
| `density.{compact,regular,comfortable}.tokens.json` | Space and control sizes, one per `density` context |

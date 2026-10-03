---
id: 119
uid: 5b99f7fa-e20a-411c-8c1e-c6bf4e9877a7
title: Read the theme's glyphs in components, and emit the control marks
type: feature
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 91
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
priority: p0
layer: tokens
effort: m
---

## Problem

0091 made glyphs tokens "a theme can swap", but nothing reads them. Every
component has its glyphs as string literals: List draws `▸`, `░` and `█`,
Button hard-codes `[` and `]`, and Frame defaults to the `single` set whatever
the theme's `borderSet` input says. A theme that chooses ASCII or rounded
boxes changes the tokens and nothing on the screen.

The tokens are CSS custom properties, and a component draws its chrome in
JavaScript, into a buffer, possibly on a server. Reading computed style is
unavailable on the server and forces a layout on the client. So the glyphs
have to reach components another way.

## Proposal

- `@rockaway/tokens` already holds the glyph tables as data. Export a resolved
  `Glyphs` object per theme (border set, marks, blocks, bars, spinner frames,
  delimiters) from the same source that writes the CSS.
- `@rockaway/react` gets a `GlyphProvider` (context) whose default is the
  default theme's glyphs, so a component works with no provider and on the
  server. A `useGlyphs()` hook is the only way a component gets a character.
- Frame's default border set comes from the provider, so a theme's `borderSet`
  input finally reaches the screen.
- Add the marks the coming components need, so fifteen component branches do
  not each regenerate `tokens.css`: control delimiters (`[` `]`), checkbox
  (`✓`, `–`, empty), switch thumb and track, radio (exists), sort ascending and
  descending, tab overflow (`‹` `›`), required (`*`), invalid (`✗`, exists),
  danger (`!`), external link, and the tree guides (drawn by the junction
  table, so only named here).

## Acceptance criteria

- [x] A typed `Glyphs` object is exported per theme, generated from the same tables as the CSS tokens, with a test that the two agree
- [x] `GlyphProvider` and `useGlyphs()` in `@rockaway/react`; with no provider a component gets the default theme's glyphs, on the server too
- [x] Frame, Divider and List read their glyphs from `useGlyphs()`; Frame's default border is the theme's border set
- [x] Every mark listed in the proposal exists as a token, and every one measures one cell by the engine's own measurement
- [x] Switching the provider to the `ascii` set redraws a Frame, a List and a Button with no glyph outside ASCII, asserted by a text snapshot
- [x] A check fails the build if a file under `packages/react/src/components` contains a box-drawing, block, braille or mark character outside a comment
- [x] `tokens.css` regenerated once here, so component branches after this need not touch it

## 2026-10-03

The border set decides the whole repertoire: a theme whose borderSet is ascii draws its marks, blocks, bars and spinner in ASCII too (cursor >, scrollbar # and ., ellipsis ~). A sixth theme input could disagree with the border set, and a terminal that cannot show ┌ cannot be trusted with ▸ either. Every theme input stays as it was.

## 2026-10-03

Glyphs reach components as a resolved object (glyphsFor / themeGlyphs in @rockaway/tokens), not CSS: chrome is drawn into a buffer in JS, often on a server. The DTCG glyph tokens are now written from the same object, and a test compares the object with both the DTCG tree and tokens.css. @rockaway/react now depends on @rockaway/tokens at runtime. themes/*.json are imported as JSON (resolveJsonModule added to tsconfig.base) so presets are reachable by name; 0052 can build on that registry.

## 2026-10-03

Pure buffer functions (frameBuffer, dividerBuffer, drawRule, scrollbarBuffer) take the glyphs as a trailing argument defaulting to the default theme, so their snapshots stay pure. Grid's drawBox and drawText gained an ellipsis option: without it an ascii Frame still truncated its title with …. Radio is a single mark in both repertoires (● ○, * o) rather than delimited, so its empty state is visible; checkbox is check/dash/blank between the control delimiters.

## 2026-10-03

The literal-glyph check is a Node test (packages/react/test/no-literal-glyphs.test.ts): box drawing, blocks, geometric shapes, dingbats, braille, plus every non-ASCII character in the theme tables, outside comments. KeyHint's key legends (⌘ ⇧ ↑) are content, not theme glyphs, and are deliberately not caught.

## Result

Components draw every glyph from useGlyphs() (@rockaway/react), fed by GlyphProvider with a theme's resolved Glyphs (themeGlyphs / glyphsFor in @rockaway/tokens); default is the default theme, server included. Marks for the coming controls are in glyph.mark.* and glyph.delimiter.control: check/dash/blank between [ ], radio/radio-empty, switch-thumb/track, sort-ascending/descending, overflow-start/end, required, danger, external, cross. An ascii border set means an ASCII repertoire throughout. A test fails the build on a box, block, braille or mark literal under packages/react/src/components.

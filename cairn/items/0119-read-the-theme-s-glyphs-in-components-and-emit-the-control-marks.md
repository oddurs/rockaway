---
id: 119
uid: 5b99f7fa-e20a-411c-8c1e-c6bf4e9877a7
title: Read the theme's glyphs in components, and emit the control marks
type: feature
status: backlog
milestone: primitives
depends_on:
- 91
created: 2026-10-03
updated: 2026-10-03
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

- [ ] A typed `Glyphs` object is exported per theme, generated from the same tables as the CSS tokens, with a test that the two agree
- [ ] `GlyphProvider` and `useGlyphs()` in `@rockaway/react`; with no provider a component gets the default theme's glyphs, on the server too
- [ ] Frame, Divider and List read their glyphs from `useGlyphs()`; Frame's default border is the theme's border set
- [ ] Every mark listed in the proposal exists as a token, and every one measures one cell by the engine's own measurement
- [ ] Switching the provider to the `ascii` set redraws a Frame, a List and a Button with no glyph outside ASCII, asserted by a text snapshot
- [ ] A check fails the build if a file under `packages/react/src/components` contains a box-drawing, block, braille or mark character outside a comment
- [ ] `tokens.css` regenerated once here, so component branches after this need not touch it

---
id: 52
uid: 4b7efeb2-b4d0-4fd7-9dc8-08621cc37143
title: Ship every theme as a CSS context, including imported terminal themes
type: feature
status: backlog
milestone: primitives
depends_on:
- 89
- 94
created: 2026-09-22
updated: 2026-10-03
priority: p1
layer: tokens
effort: m
---

## Problem

Four theme presets exist as inputs (`themes/default.json`, `ice`, `ink`,
`phosphor`) and as exported terminal files, but only the default is compiled
to CSS: a page cannot switch to `phosphor`. And 0094 can import a terminal
theme, which is the most persuasive thing this system can do for its audience
("bring your own palette"), and nothing ships one.

Multi-brand theming, on a character grid, is multi-palette: any terminal
theme, validated by the same gate.

## Proposal

- Each preset compiles to its own stylesheet,
  `@rockaway/tokens/themes/<name>.css`, scoped to `[data-rk-theme="<name>"]`,
  in light and dark. The default stays in `tokens.css`.
- A curated set of well-known terminal palettes is imported through 0094's
  importer and shipped the same way, each with its licence recorded beside it.
- An imported theme declares which modes it has; a single-mode theme pins the
  mode.
- The contrast gate runs on every shipped theme. A theme that fails is
  adjusted by the generator, and the adjustment is printed, or it does not
  ship.

## Acceptance criteria

- [ ] Every preset is a CSS context, and a story switches between them without a rebuild
- [ ] At least four imported terminal palettes ship, each with a recorded licence that permits it
- [ ] Every shipped theme passes the contrast gate in every mode it declares, in CI
- [ ] Switching theme changes no geometry: conformance is identical across themes
- [ ] The site (0106, 0148) lists every theme and offers each terminal format for download

## 2026-10-03

Rewritten by the program plan: the pre-pivot template text is replaced with how this works on the grid, the criteria are one list (the template, plus the contracts from the plan, plus this item's own), and the dependencies point at the contracts it is built on.

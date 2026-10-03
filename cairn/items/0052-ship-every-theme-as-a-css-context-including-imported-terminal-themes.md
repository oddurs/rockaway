---
id: 52
uid: 4b7efeb2-b4d0-4fd7-9dc8-08621cc37143
title: Ship every theme as a CSS context, including imported terminal themes
type: feature
status: review
milestone: primitives
assignee: Oddur Sigurdsson
claimed: 2026-10-03
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

- [x] Every preset is a CSS context, and a story switches between them without a rebuild
- [x] At least four imported terminal palettes ship, each with a recorded licence that permits it
- [x] Every shipped theme passes the contrast gate in every mode it declares, in CI
- [x] Switching theme changes no geometry: conformance is identical across themes
- [ ] The site (0106, 0148) lists every theme and offers each terminal format for download

## 2026-10-03

Rewritten by the program plan: the pre-pivot template text is replaced with how this works on the grid, the criteria are one list (the template, plus the contracts from the plan, plus this item's own), and the dependencies point at the contracts it is built on.

## 2026-10-03

The CSS model. A theme is data-rk-theme on any element, as data-density is; mode stays data-theme. A theme island carries both halves of its palette as raw --rk-palette-light-* and --rk-palette-dark-*. Every --rk-ansi-* is light-dark() over the two halves, and mode islands set only color-scheme. So theme and mode nest freely, in either order and on one element or two, and resolve the same; a story asserts all four. light-dark() is Baseline 2024, which matches the browserslist. The alias rule ([data-rk-theme]) re-declares ansi.* and the semantic tier on every theme island, because a var() is substituted where it is declared. forced-colors.css now remaps on [data-rk-theme] as well as :root, or an island would bring its own colours back; the forced-colors story asserts it.

## 2026-10-03

DTCG: the resolver gains a theme modifier. theme.<name>.tokens.json holds palette.light/dark, font and glyph; mode.<mode>.tokens.json only points ansi.* at one half; base.tokens.json keeps strokes and attributes. Terrazzo writes tokens.css plus one sheet per non-default theme (themes/<name>.css, exported as @rockaway/tokens/themes/<name>.css) through one css plugin instance per sheet. scripts/finish-css.ts rewrites the ansi aliases to light-dark(), appends the mode islands and pins single-mode themes. check-css compares every sheet and flags any that are no longer built.

## 2026-10-03

Imported: Catppuccin (Latte/Mocha, MIT), Dracula (dark, MIT), Nord (dark, MIT), Solarized (both, MIT), Tokyo Night (Day/Night, Apache-2.0). Each palette was taken from the upstream terminal port (ghostty or alacritty, or the Solarized README's ANSI table), and the upstream LICENSE file is copied beside it. Every theme is fitted to the 0163 gate in each mode it declares; the fit now also keeps border-strong at least as strong as border (0178). Solarized light is moved the most: its foreground goes from #657b83 to #354a51 to reach 7:1. Every move is printed by pnpm generate and listed in a snapshot test. Not done: imported themes are not exported back to terminal files, and the site's list and downloads (criterion 5) belong to 0148/0106.

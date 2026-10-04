---
id: 106
uid: 7cfb14bd-1ca0-442d-97e6-22993faf897d
title: Write the foundations pages
type: docs
status: done
milestone: site
assignee: Oddur Sigurdsson
depends_on:
- 52
- 104
- 138
- 143
created: 2026-09-22
updated: 2026-10-03
closed_at: 2026-10-03
priority: p0
layer: docs
effort: l
---

## Acceptance criteria

- [x] The grid: the cell, the rules, the six inputs
- [x] Strictness: the three levels, and how to declare an exception you mean
- [x] Glyphs: the border sets, the junction table, what happens to CJK and emoji
- [x] Colour: the ANSI 16, the roles, the contrast gate, and importing a terminal theme
- [x] Every page is itself drawn by the system, and every example is copyable
- [x] A token reference generated from the DTCG sources, not written by hand
- [x] Every shipped theme (0052) shown, with its terminal files for Ghostty, kitty, Alacritty and iTerm2 to download
- [x] Accessibility: what is tested (axe, conformance, continuity, forced colors, the screen-reader pass) and the known limits from the concept's "Where it is thin"

## 2026-10-03

Rewritten by the program plan: the pre-pivot template text is replaced with how this works on the grid, the criteria are one list (the template, plus the contracts from the plan, plus this item's own), and the dependencies point at the contracts it is built on.

## 2026-10-03

Seven pages at /foundations/ (grid, strictness, glyphs, colour, themes, tokens, accessibility) plus an index, written in MDX in apps/site/src/content/foundations. MDX because their examples and tables are generated at build time from the published packages (src/lib/foundations.ts, src/lib/tokens.ts): the border sets, the junction crossing and the wide-character frame are buffers the engine draws, and the palette, marks, blocks, densities, breakpoints, contrast table, gate size and the 339-token reference are read from @rockaway/tokens. The conformance report is the real formatReport's output. Examples render through Painted.astro, which writes rowRuns() as the painter's own markup (rows of rk-run cells with data-rk-shape), so they are drawn by the cell renderer with no JavaScript and copy as text. A figure role=img carries a label in place of the glyphs. The Markdown pipeline (tables sized in cells, cells for box drawing) applies to MDX too.

## 2026-10-03

On the criteria. 'The six inputs': a theme has five (accentHue, neutralTemperature, typePairing, borderSet, conformance; radius and elevation left with 0092). The grid page lists the five, plus the three runtime contexts (theme, mode, density). Importing a terminal theme: the colour page says how the five imported themes were made, and that adding one is today a change to the repository. There is no consumer-facing importer; proposed as a follow-up. Themes: every one of the nine is shown in each mode it declares, as a data-rk-theme island with a frame in its border set and its sixteen colours. Its Ghostty, kitty, Alacritty and iTerm2 files are served by a static endpoint (src/pages/terminal/[format]/[file].ts) straight from what @rockaway/tokens ships under terminal/. Accessibility: what is tested comes from the concept and the workbench; the VoiceOver pass is described as planned (0152), not done; the known limits are the concept's, plus 0197's target size until the new line box ships.

## 2026-10-03

Found along the way. (1) A sized table could still be squeezed by Chromium below its specified column widths, and code like --rk-fg-on-inverse then broke after a hyphen. prose.css now keeps code in a sized table on one line, so a column is never narrower than its widest word (patch changeset). (2) Vitest sets BASE_URL in process.env, and an Astro build's prerender reads import.meta.env.BASE_URL from there, so links built with href() lost their base when the site test ran the build. The test now strips BASE_URL from the child's environment. Any CI that sets BASE_URL would hit the same thing. (3) Screen does not remeasure when a web font finishes loading, only when its box resizes; proposed as a follow-up.

## Result

Seven foundations pages at /foundations/ in MDX, with every example drawn by the engine and painted as the painter's markup at build time, and every table read from @rockaway/tokens (token reference, palette, marks, contrast, densities); every theme shown in its modes with its terminal files served from the package.

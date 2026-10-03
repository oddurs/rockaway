---
id: 143
uid: f5751c83-f815-41d9-ad19-cfb355b9afdc
title: 'Set prose on the grid: headings, lists, quotes, code and tables from Markdown'
type: feature
status: done
milestone: site
assignee: Oddur Sigurdsson
depends_on:
- 117
- 118
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
priority: p0
layer: css
effort: m
---

## Problem

Most of the site is prose written in Markdown: the foundations pages, the
guides, every component page. Nothing in `@rockaway/css` styles a heading, a
list or a blockquote for the grid, and a monospace page with browser-default
margins is off the grid within three lines. "If the site needs it, the system
grows it" (0077), so this is part of the CSS package, not the site.

## Proposal

`packages/css/src/prose.css`, applied by a `.rk-prose` class (or the `Prose`
component wrapping it), in its own cascade layer slot:

- Headings are one size (0075): `h1` bold and underlined with a `═` rule drawn
  by the cell renderer, `h2` bold with a `─` rule, `h3` bold, `h4` and below
  bold dim. Each takes whole rows above and below.
- Paragraphs, lists and blockquotes are spaced in whole rows; list markers are
  glyph tokens (`·`, numbers right-aligned in a cell column); a blockquote is a
  `│` gutter drawn by the cell.
- Inline code is reverse-subtle; `kbd` uses KeyHint's styling.
- Markdown tables become grid tables (shared look with Table, 0057).
- `hr` is a Divider.
- A measure of 80 cells, the width terminals have always used.

## Acceptance criteria

- [x] A story renders a long Markdown fixture (every element) and it passes conformance at all four densities
- [x] Heading rules and quote gutters are drawn by the cell renderer and pass continuity
- [x] The heading outline is correct, and nothing in the rules or gutters is in the accessibility tree
- [x] The measure is 80 cells, and prose reflows to 40 cells without horizontal scroll (only tables and code may scroll)
- [x] The site's Markdown pipeline applies it with no per-page styles
- [x] `h1` carries no `letter-spacing` in `base.css`, so a heading stays on the grid

## 2026-10-03

Claimed ahead of 0117 and 0118 at the CTO's direction. Everything except the heading rules and quote gutters is independent of 0117's cell renderer. Those two are built on its shapes and rebased onto #67 when it merges. 0118 is the state vocabulary and prose has no states of its own beyond links, which Link (0135) already draws.

## 2026-10-03

Lines: the h1/h2 rules, the table header rule, hr and the quote gutter are pseudo-elements (hr is the element itself) one row tall or one cell wide. They share 0117's generated rules for ═, ─ and │ through an alias table in packages/css/scripts/shapes.ts, so the geometry stays the engine's. The generator refuses an alias on a shape that does not run the length of its box. I agreed this with the Rendering engineer. checkContinuity needs a box and a character per cell, which a pseudo-element has neither of. So the Lines stories (prose-lines.ts) ask its question of a whole line instead: in a real screenshot, is the line inked from end to end with no gap, and does it run through the middle of its row or cell? They check at four densities, in light, dark and forced colors, and again at 2x in the zoom project. Breaking the hr and the gutter on purpose made the check fail, as it should.

## 2026-10-03

Tables: the browser squeezes an auto-layout table in fractions of a pixel, which takes its columns off the grid (conformance caught it at 40 cells). So prose.css never lets a table be squeezed. A table is max-content wide and scrolls in its own box, and its cells do not wrap. A Markdown pipeline can instead give each col a width in whole cells (--rk-cols), and then cells wrap inside it. The site's pipeline does this, sharing the 80-cell measure among the columns: each column gets its longest word, and the remaining space is shared out in proportion to how much more text each column has, in whole cells. Rows that wrap are separated by a blank row.

## 2026-10-03

Also done in the site pipeline: box drawing and block characters in prose (diagrams in code blocks, a ┌ in a sentence) become data-rk-shape cells, so the cell draws them. Without that they fell back to the system font and broke apart at airy and touch. A straight run like ── is one box --rk-run cells wide. Code is unhighlighted (syntaxHighlight false) until 0144, so no borrowed palette ships in the meantime. Relative links in repository docs go to GitHub. pre and table get tabindex=0, because axe requires a scrollable region to be reachable by keyboard.

## 2026-10-03

Found while testing: since 0117, measureCell rounds the advance to 1/64px. The advance text is actually laid out at (Chromium; SF Mono 9.633px, JetBrains Mono 9.6px) is not a multiple of 1/64, so 80 cells of real text land up to about 0.6px from 80 measured cells. That is beyond conformance's 0.5px tolerance. The prose story measures the cell from an 80-character probe instead. A Screen whose content layer holds long text lines would hit the same thing. I've reported it to Rendering.

## 2026-10-03

Known limits: on platforms with classic scrollbars (desktop Windows and Linux), a code block or table that scrolls gains the scrollbar's height, which is in pixels. Overlay scrollbars (macOS, iOS, Android) and headless Chromium are unaffected. Proposed as a follow-up: hide the scrollbar and show the overflow-start and overflow-end marks (‹ ›) instead, as less -S does. Tables made display:block keep their semantics in Chromium; the VoiceOver pass in 0152 should confirm Safari does too.

## Result

packages/css/src/prose.css: .rk-prose in a new rk.prose layer, with an 80-cell measure rounded to whole cells; rules, gutter and hr drawn with the 0117 shapes; tables never squeezed. The site's Markdown pipeline (apps/site/src/lib/markdown.ts) sizes table columns in cells, turns box drawing into cells, and renders docs/concept.md at /concept/.

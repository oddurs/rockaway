---
id: 143
uid: f5751c83-f815-41d9-ad19-cfb355b9afdc
title: 'Set prose on the grid: headings, lists, quotes, code and tables from Markdown'
type: feature
status: backlog
milestone: site
depends_on:
- 117
- 118
created: 2026-10-03
updated: 2026-10-03
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

- [ ] A story renders a long Markdown fixture (every element) and it passes conformance at all four densities
- [ ] Heading rules and quote gutters are drawn by the cell renderer and pass continuity
- [ ] The heading outline is correct, and nothing in the rules or gutters is in the accessibility tree
- [ ] The measure is 80 cells, and prose reflows to 40 cells without horizontal scroll (only tables and code may scroll)
- [ ] The site's Markdown pipeline applies it with no per-page styles
- [ ] `h1` carries no `letter-spacing` in `base.css`, so a heading stays on the grid

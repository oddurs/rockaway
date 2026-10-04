---
id: 150
uid: cd10055c-c532-4d49-812d-c3836f3a0842
title: Give every page a title, a description and a social card drawn by the engine
type: feature
status: doing
milestone: site
assignee: Oddur Sigurdsson
claimed: 2026-10-04
depends_on:
- 103
- 126
created: 2026-10-03
updated: 2026-10-04
priority: p1
layer: site
effort: m
---

## Problem

The launch is a link on Hacker News and in chat apps. The preview card is the
first impression, and for a TUI system the card should be a screen, rendered
by the engine, not a designed image.

## Acceptance criteria

- [x] Every page has a unique title and description, canonical URL, and `og:` and `twitter:` tags
- [x] Each page's social card is generated at build time from a screen (the page's title in a frame, in the default theme) through the text or ANSI painter to SVG and then PNG; no hand-made images
- [x] A sitemap, a `robots.txt` and a 404 page that is itself a TUI screen with a way home
- [x] A favicon drawn from the grid (a box-drawing glyph), in SVG with a PNG fallback

## 2026-10-04

Built on feat/cards, stacked on the switcher. Every page's head now has a unique title and description, a canonical link, Open Graph and Twitter tags, and the favicon. Titles and descriptions come from src/lib/pages.ts, which reads the same collections and metadata the pages do, and holds the four pages whose words were written in their own .astro files, so a card never says what its page does not. Cards: the engine draws each page's title and description in a frame (src/lib/card.ts). The engine's new SVG painter (@rockaway/grid toSvg, with a changeset) paints it, drawing every line from the cell renderer's shapes. The letters are the site's own JetBrains Mono subset as outlines read by HarfBuzz, so no font has to be installed. sharp makes the 1200x630 PNG. The criterion names the text or ANSI painter; an SVG painter in the engine is the same idea done directly, and it is reusable. sitemap.xml and robots.txt are endpoints; robots.txt only counts at a domain's root, so it matters once the site has a domain of its own. The 404 page is a screen in the shell, with the map and a link home. The favicon is two panes and their rule (┌┬┐ / └┴┘) drawn by the same painter, in SVG and as a 180px PNG. New dev dependencies of the site, all build-time: sharp, harfbuzzjs and fontverter (pinned; sharp was already in the tree through Astro).

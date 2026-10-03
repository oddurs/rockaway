---
id: 150
uid: cd10055c-c532-4d49-812d-c3836f3a0842
title: Give every page a title, a description and a social card drawn by the engine
type: feature
status: backlog
milestone: site
depends_on:
- 103
- 126
created: 2026-10-03
updated: 2026-10-03
priority: p1
layer: site
effort: m
---

## Problem

The launch is a link on Hacker News and in chat apps. The preview card is the
first impression, and for a TUI system the card should be a screen, rendered
by the engine, not a designed image.

## Acceptance criteria

- [ ] Every page has a unique title and description, canonical URL, and `og:` and `twitter:` tags
- [ ] Each page's social card is generated at build time from a screen (the page's title in a frame, in the default theme) through the text or ANSI painter to SVG and then PNG; no hand-made images
- [ ] A sitemap, a `robots.txt` and a 404 page that is itself a TUI screen with a way home
- [ ] A favicon drawn from the grid (a box-drawing glyph), in SVG with a PNG fallback

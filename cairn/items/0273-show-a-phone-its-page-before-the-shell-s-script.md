---
id: 273
uid: 1f240966-104e-4c41-be65-e9ebc08b2530
title: Show a phone its page before the shell's script
type: bug
status: doing
milestone: site
assignee: Oddur Sigurdsson
claimed: 2026-10-09
created: 2026-10-09
updated: 2026-10-09
priority: p1
layer: site
effort: m
---

## Purpose

On Slow 4G the site painted blank until the shell measured (~944ms landing). The server places the page pane where the script will, so a phone shows content at ~550ms with zero layout shift. On feat/cards.

## 2026-10-09

apps/web (Next): the shell is now one CSS grid of whole-cell tracks, laid out by the stylesheet from attributes the head's script sets before the first frame. Pane borders are drawn on the server (frameBuffer + chromeRows, elastic) once per glyph set, the map and outline are server markup, and the only client component is a small status-bar island. Hydration changes no geometry: test/shell.test.ts measures CLS 0 at 320, 390, 1280 and 1440, fast and Slow 4G, on home, concept, components and tree.

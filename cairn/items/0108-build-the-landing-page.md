---
id: 108
uid: 1ff38058-4629-4d78-87d5-62852fd128ac
title: Build the landing page
type: feature
status: done
milestone: site
assignee: Oddur Sigurdsson
depends_on:
- 104
- 126
- 138
- 148
created: 2026-09-22
updated: 2026-10-09
closed_at: 2026-10-09
priority: p0
layer: site
effort: l
---

## Problem

This is the page that gets posted, read on a phone, and judged in four
seconds.

## Acceptance criteria

- [x] A live screen above the fold that is the real system, not an image, and that works before JavaScript loads
- [x] The claim in one line, the constraint in three, a copyable example, and a link to the docs
- [x] Honest: no benchmark without a method, no feature that is not shipped
- [x] Readable at 40 cells on a phone, and at 400% zoom
- [x] Theme switcher over the real palettes, including the imported terminal themes

## 2026-10-04

Criteria 1 to 4 are proven by the site test's landing block: the drawing painted with no script (no script loaded at all), the claim, the three rules, the code, the install line and the links, drawing by pointer and keys, and no scrolling across at 390 px and at 320 px (400% zoom). Honest: no benchmark; the install line says it is not on npm yet. Criterion 5 is the status bar's look (0148): t moves through all nine themes, the five imported ones included. The page also ships no React and about 27 kB of script; the test holds it under 40 kB (0254). Its h1 is 0255.

## 2026-10-09

apps/web (#245): home is the first page inside the shell; its drawing is the server's and live once the engine loads, its shots and frames server-rendered and hydrated as they near the view. Not done here: the owner's sunset restyle of home (dusk sky, sea and sand bands, the two CTAs, Text at size 3), which waits on Text (#230).

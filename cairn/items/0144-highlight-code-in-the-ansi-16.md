---
id: 144
uid: 69065b47-83fc-4cca-bbd7-adc083911cb3
title: Highlight code in the ANSI 16
type: feature
status: backlog
milestone: site
depends_on:
- 89
- 103
created: 2026-10-03
updated: 2026-10-03
priority: p1
layer: tokens
effort: s
---

## Problem

The site is mostly code examples. A borrowed syntax theme would bring its own
palette and break the one promise the colour system makes: sixteen colours,
gated for contrast, that the reader's terminal already has.

## Proposal

Generate a Shiki theme from the semantic tokens at build time: each TextMate
scope maps to an ANSI role (keywords magenta, strings green, comments dim, and
so on, the way terminal editors do it) through CSS variables, so the highlight
follows the theme switcher and the mode with no rebuild.

## Acceptance criteria

- [ ] Code on the site is highlighted at build time, with no highlighting JavaScript shipped
- [ ] Every highlight colour is a token, and the contrast gate covers each against `bg.surface` in both modes
- [ ] Switching theme or mode re-colours code without a reload
- [ ] Emphasis that matters (comments, errors) also carries an attribute, so code reads in greyscale

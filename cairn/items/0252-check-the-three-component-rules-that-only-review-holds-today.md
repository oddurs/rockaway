---
id: 252
uid: 12006095-2b7b-479a-abd0-7f23926e6a9a
title: Check the three component rules that only review holds today
type: chore
status: done
milestone: v0.1
assignee: Oddur Sigurdsson
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
priority: p2
layer: tooling
effort: m
---

## Purpose

The component recipe (0134) names three rules no test enforces: no glyph in an accessible name outside fields, no hand-written key or focus listener in a component, and no non-semantic token in a component stylesheet. Write a check for each, with a fixture that fails it. Proposed by polish-chrome in 0134.

## 2026-10-03

Rule 3, names: checkNames in @rockaway/react/testing runs after every story beside checkField (parameter names: false for a story that breaks it on purpose; Grid/Name check shows it). It reads names by the routes the system uses (aria-labelledby, aria-label, label, alt, content for content-named roles, minus aria-hidden) and fails box drawing, blocks, geometric shapes, dingbats, braille and the theme's non-ASCII marks. The ellipsis, dash and bullet marks are allowed outside fields, because prose names hold them (Save as...). A field's names stay checkField's, which still counts every mark; the two share glyphTest and spoken.

## 2026-10-03

Rule 4, listeners: no-hand-listeners.test.ts parses src/components with oxc and fails onKey/onFocus/onBlur props or merged keys, addEventListener for key, focus or blur events, and assigned handlers. The one exception, Keymap's document keydown listener (0141), is listed with its reason and fails if it stops occurring.

## 2026-10-03

Rule 5, tokens: semantic-tokens.test.ts in @rockaway/css fails a component stylesheet that reads --rk-ansi-* or --rk-palette-*, or writes a colour literal, and fails if tokens.css stops defining those prefixes. No component breaks any of the three today. The recipe (#155, unmerged) still says review holds these rules; each needs its line updated once it lands.

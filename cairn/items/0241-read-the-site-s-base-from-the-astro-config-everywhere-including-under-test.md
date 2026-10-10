---
id: 241
uid: a0e848ae-7846-4481-8539-0c4fe597f264
title: Read the site's base from the Astro config everywhere, including under test
type: chore
status: ready
milestone: site
created: 2026-10-03
updated: 2026-10-03
priority: p3
layer: site
effort: s
---

## Purpose

Vitest sets BASE_URL=/, which overrides import.meta.env.BASE_URL in server modules, so links built from it drop /rockaway/ under test. llms.txt now reads the base from astro:config/server; href() in .astro pages may have the same blind spot. Found by the tokens engineer in 0048.

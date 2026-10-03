---
id: 171
uid: 630abf97-8506-45f4-80cc-111863b55bd1
title: Draw each component's snapshot in every theme on the site
type: feature
status: backlog
milestone: site
depends_on:
- 47
- 147
created: 2026-10-03
updated: 2026-10-03
priority: p3
layer: site
effort: s
---

## Problem

Snapshots in the metadata are drawn with the default theme. The ascii theme in
particular is a selling point; a component page should show it.

## Acceptance criteria

- [ ] The metadata carries the draw arguments, not only the text, so the site can redraw a snapshot per theme
- [ ] A component page switches its snapshots with the theme switcher

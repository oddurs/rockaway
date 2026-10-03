---
id: 188
uid: 52c48294-f074-487d-9857-e69a9abd73b9
title: Export the fitted imported themes back to terminal files
type: feature
status: backlog
milestone: site
depends_on:
- 52
created: 2026-10-03
updated: 2026-10-03
priority: p2
layer: tokens
effort: s
---

## Problem

The site promises every theme as a download for every terminal, but only the
presets are exported. Imported themes (0052) are fitted to the contrast gate, so
their files must carry the adjusted palette and the upstream credit.

## Acceptance criteria

- [ ] Every imported theme is exported for ghostty, kitty, alacritty and iTerm2, with the upstream licence and credit in each file's header
- [ ] The round trip (0094) holds for them

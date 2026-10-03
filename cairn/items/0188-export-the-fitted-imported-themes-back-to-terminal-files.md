---
id: 188
uid: 52c48294-f074-487d-9857-e69a9abd73b9
title: Export the fitted imported themes back to terminal files
type: feature
status: done
milestone: site
assignee: Oddur Sigurdsson
depends_on:
- 52
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
priority: p2
layer: tokens
effort: s
---

## Problem

The site promises every theme as a download for every terminal, but only the
presets are exported. Imported themes (0052) are fitted to the contrast gate, so
their files must carry the adjusted palette and the upstream credit.

## Acceptance criteria

- [x] Every imported theme is exported for ghostty, kitty, alacritty and iTerm2, with the upstream licence and credit in each file's header
- [x] The round trip (0094) holds for them

## 2026-10-03

Each imported theme is written for all four terminals in the modes it declares (Dracula and Nord are dark only), from the same fitted palette the web uses, as rockaway-<theme>-<mode>. Every file's header gives four things: the source; the slots fitting changed, limited to the twenty a terminal file holds, since muted and the borders are ours; the SPDX licence and copyright line; and the upstream licence in full. Both MIT and Apache-2.0 require the licence to travel with a copy, and Apache-2.0 requires a changed file to say it was changed. In iTerm2 plists the header is an XML comment after the declaration, with any -- broken up as - -. Tokyo Night's Apache text makes those files about 230 lines long; that is the price of shipping it properly.

## 2026-10-03

The terminal script now builds from themeContexts rather than reading themes/*.json, and it deletes files for a theme that no longer ships. The round trip is tested for every imported theme and mode: parse the Ghostty file, import it, and compare the sixteen colours plus background and foreground to the fitted palette, within one 8-bit step. A further test checks every file on disk against the generator, header included.

## Result

Every imported theme (Catppuccin, Dracula, Nord, Solarized, Tokyo Night) ships for Ghostty, Kitty, Alacritty and iTerm2 in each mode it declares, as terminal/<format>/rockaway-<theme>-<mode>, using the fitted palette. Each file's header has the source, the slots fitting changed, and the upstream licence in full. The 0094 round trip holds for all of them.

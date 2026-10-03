---
'@rockaway/tokens': minor
---

The imported themes now ship as terminal themes too: Catppuccin, Dracula, Nord, Solarized and Tokyo Night, each for Ghostty, Kitty, Alacritty and iTerm2, in every mode the theme declares, under `terminal/<format>/rockaway-<theme>-<mode>`. The colours are the fitted ones the web uses. Each file opens with where the palette came from, which colours fitting changed to pass the contrast gate, and the upstream licence in full. `terminalThemes` takes an optional header for this, and `importedHeader` builds it.

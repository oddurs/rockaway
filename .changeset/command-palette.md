---
'@rockaway/react': minor
'@rockaway/css': minor
---

Add `CommandPalette`: search every command, run one, and get out of the way. Give it `commands`, each with an `id`, a `label`, an optional `section` and an optional `keys` chord, and put a `Keymap` around it. It binds its own chords (`mod+k` and `/` by default, through `chords`) and every command's chord through the keymap, so a row's chord is the spec that binds it and `KeymapHelp` lists them all. It opens as a modal framed double: an input row with the theme's prompt mark and the chord that opens it, a rule, and the matching commands as menu rows, their sections' titles set into the frame. Matching is fuzzy, and a matched character is underlined as well as in the accent. The arrows move through the results while focus stays in the input, Enter runs one, and Escape clears what was typed and then closes the palette. Loading, no commands and nothing matching are each said on the first row. `fuzzyMatch`, `matchCommands` and `commandPaletteBuffer` are its pure half.

An `OverlayModal` mounted closed now takes its contexts and painter from what had focus when it opened, rather than when it first rendered.

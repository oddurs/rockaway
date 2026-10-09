---
'@rockaway/react': patch
---

`spokenKeys`, and so every KeyHint's spoken form, now names the modifiers the way the reader's keyboard does. Off an Apple keyboard the meta key is "Meta", not "Command", so `meta+k` is announced "Meta K" on Windows and Linux; on an Apple keyboard Alt is "Option", the word on the key. `mod` is unchanged: "Command" on an Apple keyboard and "Control" elsewhere.

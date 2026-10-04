---
'@rockaway/react': patch
---

`keymapHelpBuffer`, `tableBuffer` and `tableLayout` now live in their components' pure halves, so a server component can call them and gets the functions themselves, not client references, as it already could with `frameBuffer` and the other buffer functions. Their exports from `@rockaway/react`, `@rockaway/react/keymap` and `@rockaway/react/table` are unchanged.

---
'@rockaway/react': patch
---

`keyShortcut`, and so every `aria-keyshortcuts` a `Button`, a `KeyHint`'s control or a `Keymap` binding sets, names its key as WAI-ARIA 1.2 does: a letter as its capital (`shift+y` is `Shift+Y`, and `mod+s` is `Meta+S` or `Control+S`), a function key as `F1`, and a named key as its UI Events key value (`Escape`, `Enter`, `ArrowUp`, `PageDown`), with `Space` for the space bar. It said `esc`, `up` and `pagedown` before, which are no key's name.

`formatKeys`, and so every `KeyHint` and `KeymapHelp` row, shows a letter on its own as you type it, lower case: `y`, and `g h` for a sequence. A letter with a modifier is still a keycap, upper case: `⌘K`, `Ctrl+K`, `⇧Y`. In terminal notation a capital alone now means Shift, so `y` is `y` and `shift+y` is `Y`. Before, both were `Y`, in both notations.

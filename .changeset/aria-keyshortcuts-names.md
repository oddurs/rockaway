---
'@rockaway/react': patch
---

`keyShortcut`, and so every `aria-keyshortcuts` a `Button`, a `KeyHint`'s control or a `Keymap` binding sets, names its key as WAI-ARIA 1.2 does: a letter as its capital (`shift+y` is `Shift+Y`, and `mod+s` is `Meta+S` or `Control+S`), a function key as `F1`, and a named key as its UI Events key value (`Escape`, `Enter`, `ArrowUp`, `PageDown`), with `Space` for the space bar. It said `esc`, `up` and `pagedown` before, which are no key's name.

---
'@rockaway/react': patch
---

`keymapHelpBuffer` now lives in the keymap's pure half, so a server component can call it and gets the function itself, not a client reference, as it already could with `frameBuffer` and the other buffer functions. Its export from `@rockaway/react` and `@rockaway/react/keymap` is unchanged.

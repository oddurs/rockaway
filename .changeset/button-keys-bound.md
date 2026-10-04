---
'@rockaway/react': minor
---

Inside a `Keymap`, a `Button` with `keys` now binds its chord as well as drawing and announcing it: pressing the chord presses the button, and `KeymapHelp` lists it under the button's label. A disabled button is not bound. Outside a `Keymap` nothing changes, and the app listens for the chord itself. `useKeymapIfAny` is the hook it uses: `useKeymap` where a keymap is optional.

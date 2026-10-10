---
'@rockaway/react': minor
---

`KeymapHelp` takes `bindings`: the shortcuts to list instead of the ones active where it is rendered. A server registers no bindings, because it runs no effects, so a page that binds its keys without React (through the keymap engine) renders its help from the same list it binds, with no `Keymap` around it.

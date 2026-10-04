---
'@rockaway/react': minor
'@rockaway/css': minor
---

Add the keymap: the page's shortcuts in one place. `<Keymap>` at the root listens to the document once; `useKeymap(bindings)` binds chords (`mod+k`) and two-key sequences (`g h`, whose second key has to come within a second) anywhere inside it. A plain key is ignored while focus is in a field that takes text, so typing `g` there types `g`, and a chord with Control, Alt or Command fires anywhere. A `<Keymap>` inside another is a scope whose bindings shadow the same keys outside it, and `<Keymap modal>` stands the page's bindings down while a dialog is open. A key a component already handled never reaches it. Two bindings for the same keys in one scope, or a chord that starts a sequence, are reported once through `onConflict` (a console warning unless given). A binding with a `target` puts `aria-keyshortcuts` on it and, given no `action`, presses it. `<KeymapHelp>` lists exactly the bindings active where it is rendered, as KeyHints and their descriptions in two columns of cells, so a `?` screen is generated from the keymap; `keymapHelpBuffer` draws it as text.

`formatKeys` and `spokenKeys` now take a sequence as well as a chord: `g h` draws as `G H` and is spoken "G then H". `keyShortcut` returns `undefined` for a sequence, because `aria-keyshortcuts` has no way to say one; its return type is now `string | undefined`.

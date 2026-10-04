---
'@rockaway/react': minor
---

The keymap engine is public, for a page with no React. `@rockaway/react/keymap` now exports, from its pure half and loading no React:

- `KeymapEngine`: scopes, bindings, chords, sequences, modal scopes, `active()` for a help screen and `conflicts()`
- `attachKeymap(engine, document)`: the page-level `keydown` listener, which `Keymap` now uses as well, so the two cannot differ in what they skip
- `isEditable` and `chordMatches`
- `detectPlatform`, for the engine's `setPlatform`
- the types `Binding`, `KeyStroke`, `KeymapScope`, `KeymapEngineOptions`, `ActiveBinding`, `KeymapConflict`, `KeyEventSource`, `Platform` and `PlatformHints`

A binding's `target` is now typed as anything with a `current`, which a React ref still is. `KeySpec` and `KeyNotation` now live in KeyHint's pure half, and are exported from `@rockaway/react/key-hint` as before.

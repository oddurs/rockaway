---
id: 141
uid: 98618ce9-68dd-4bfc-9ddc-50b91d7e5306
title: 'Keymap: global chords, sequences, and a help screen built from them'
type: feature
status: backlog
milestone: primitives
depends_on:
- 132
created: 2026-10-03
updated: 2026-10-03
priority: p1
layer: behaviour
effort: m
---

## Problem

The site's shell (0104) wants `⌘K` and `/` for the palette, `g` then a letter
to jump, `?` for help, and `j`/`k` to move. CommandPalette (0102) needs `⌘K`
from anywhere. React Aria handles keys within a component; it has no
page-level shortcut map, and rule 4 forbids each component hand-rolling one.
So the behaviour layer grows one, here, once, tested as such.

## Proposal

`useKeymap(bindings, { scope })` in `@rockaway/react`: bindings are KeySpecs
(0099's parser), single chords or sequences (`g h`) with a timeout; plain-key
bindings are ignored while focus is in an editable field, modified chords are
not; scopes nest, the innermost wins; duplicate bindings warn in development.
`<KeymapHelp>` renders every active binding as a two-column list of KeyHints
and descriptions, so `?` is generated, never written.

## Acceptance criteria

- [ ] Chords and two-key sequences fire; a sequence times out; typing `g` in a text field types `g`
- [ ] Scopes nest, and a dialog's bindings shadow the page's while it is open
- [ ] `KeymapHelp` lists exactly the active bindings, with platform-correct KeyHints, in a snapshot
- [ ] A binding's target gets `aria-keyshortcuts`, so the shortcut is announced where it applies
- [ ] The concept's rule 4 gets a sentence saying the keymap is the behaviour layer's one page-level key handler, and why

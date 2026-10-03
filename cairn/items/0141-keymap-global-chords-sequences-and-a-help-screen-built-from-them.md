---
id: 141
uid: 98618ce9-68dd-4bfc-9ddc-50b91d7e5306
title: 'Keymap: global chords, sequences, and a help screen built from them'
type: feature
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 132
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
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

- [x] Chords and two-key sequences fire; a sequence times out; typing `g` in a text field types `g`
- [x] Scopes nest, and a dialog's bindings shadow the page's while it is open
- [x] `KeymapHelp` lists exactly the active bindings, with platform-correct KeyHints, in a snapshot
- [x] A binding's target gets `aria-keyshortcuts`, so the shortcut is announced where it applies
- [x] The concept's rule 4 gets a sentence saying the keymap is the behaviour layer's one page-level key handler, and why

## 2026-10-03

Built as packages/react/src/components/keymap.tsx: a KeymapEngine with no DOM or React (scopes, bindings, chordMatches, sequences with a timer, conflicts), tested in Node with fake timers; and the React layer: <Keymap> (the outermost listens to document keydown once; nested ones are scopes; modal hides everything outside it), useKeymap(bindings, {enabled}), useActiveBindings(), <KeymapHelp> and keymapHelpBuffer. One component, Keymap, is both root and scope, so there is no separate provider to forget.

## 2026-10-03

Decisions. Matching: Control/Alt/Command must agree exactly; Shift must agree for a letter or a named key, but a punctuation key is matched by the character, so '?' is '?' however shift typed it; with Alt a letter also matches by code (a Mac types © for Option+G). A keystroke whose default was prevented never reaches the keymap, so a component that handled a key keeps it. Shadowing is by canonical keys (cmd+k = meta+k); innermost scope, then latest bound, wins. Conflicts: duplicates in one scope and a chord that is the first key of a sequence; reported once through onConflict, console.warn by default. A plain warning rather than a development-only one: the library has no build-time NODE_ENV of its own, and a conflicting keymap is a bug wherever it runs.

## 2026-10-03

KeyHint learnt sequences: formatKeys('g h') is 'G H', spokenKeys says 'G then H', and keyShortcut returns undefined for a sequence because aria-keyshortcuts has no form for one (a space in it means 'or'); its return type is now string | undefined. So a sequence binding sets no aria-keyshortcuts. Not done: Button's keys prop still only describes a chord; binding it through the keymap automatically is proposed as a follow-up. KeymapHelp lists what is active where it is rendered, so a help dialog that is itself a modal scope lists only its own keys — render the help outside a modal scope, or let the dialog be non-modal for the keymap.

## Result

The keymap is the behaviour layer's one page-level key handler: <Keymap> (root listens once; nested = scope, innermost wins; modal hides the rest) and useKeymap bind chords and two-key sequences with a one-second timeout; plain keys are ignored in text fields; a key a component handled never reaches it; duplicates and chord-prefixes-of-sequences are reported once. A binding's target gets aria-keyshortcuts and is pressed when there is no action. KeymapHelp lists exactly the active bindings as KeyHints, modelled by keymapHelpBuffer. KeyHint draws and speaks sequences; keyShortcut gives undefined for one.

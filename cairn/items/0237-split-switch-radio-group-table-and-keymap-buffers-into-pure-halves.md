---
id: 237
uid: c3e63307-5815-4db6-ab8c-61093622cfa7
title: Split Switch, Radio group, Table and Keymap buffers into pure halves
type: chore
status: done
milestone: primitives
assignee: Oddur Sigurdsson
created: 2026-10-03
updated: 2026-10-09
closed_at: 2026-10-09
priority: p3
layer: components
effort: s
---

## Purpose

switchBuffer, radioGroupBuffer, tableBuffer and keymapHelpBuffer still live in 'use client' files, so a server cannot call them without crossing the client boundary that 0126 set out. Move each into its component's .pure.ts and export it from the same entry. In progress as #146.

## 2026-10-03

In #146: Keymap (engine and keymapHelpBuffer into keymap.pure.ts) and Table (layout, chrome, fitCell, marks, tableBuffer into table.pure.ts) are done, each exported from its entry's pure line and called on the server by the server-component check. Switch and Radio group follow as #114 and #123 land.

## 2026-10-03

Added at the CTO's request, names agreed with site: the keymap engine is exported for a page with no React. From @rockaway/react/keymap's pure half: KeymapEngine, attachKeymap (the document listener, now shared with Keymap), isEditable (duck-typed, no instanceof), chordMatches, and detectPlatform (split into platform.pure.ts). The engine's types moved into keymap.pure.ts, Binding.target is typed as { current }, and KeySpec/KeyNotation moved into key-hint.pure.ts, so the .d.ts files reference no React either. test/keymap-engine.test.ts mocks react, react-dom and react-aria-components to throw on import, then drives the engine end to end.

## 2026-10-09

Landing without Switch and Radio group, at the CTO's word, so the site shell gets the keymap engine now: #114 and #123 are still open. Table and Keymap are split here; Switch's and Radio group's buffers move to their pure halves in a follow-up, to be filed.

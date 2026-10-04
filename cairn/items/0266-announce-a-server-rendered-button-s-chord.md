---
id: 266
uid: 85efde12-63c8-46d6-92e1-2ad45496eec9
title: Announce a server-rendered Button's chord
type: bug
status: done
milestone: primitives
assignee: Oddur Sigurdsson
created: 2026-10-04
updated: 2026-10-04
closed_at: 2026-10-04
priority: p2
layer: components
effort: s
---

## Purpose

React Aria's Button drops aria-keyshortcuts, and Button sets it in an effect, so an unhydrated server-rendered Button with keys never announces its chord. Render the attribute through React Aria's render route, with a server-render test.

## 2026-10-04

On #145 (7cb1f20): Button draws its element through React Aria's render prop with aria-keyshortcuts on the <button> itself, so it is in the server HTML; no wrapper. The useEffect that set it is gone. test/button.test.ts asserts it in renderToStaticMarkup, for both keyboards and Shift+Y, and that a sequence or no keys sets none. The server value is the neutral keyboard's, as the drawn hint is; the reader's follows on hydration. site removes its by-hand keyShortcut once #145 lands.

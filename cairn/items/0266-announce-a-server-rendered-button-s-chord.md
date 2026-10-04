---
id: 266
uid: 85efde12-63c8-46d6-92e1-2ad45496eec9
title: Announce a server-rendered Button's chord
type: bug
status: ready
milestone: primitives
created: 2026-10-04
updated: 2026-10-04
priority: p2
layer: components
effort: s
---

## Purpose

React Aria's Button drops aria-keyshortcuts, and Button sets it in an effect, so an unhydrated server-rendered Button with keys never announces its chord. Render the attribute through React Aria's render route, with a server-render test.

---
id: 224
uid: fd3f40c1-1096-4471-b642-608db8498a93
title: Button forwards a ref
type: bug
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 131
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
priority: p2
layer: components
effort: s
---

## What happens

`Button` sets `ref={host}` after spreading the caller's props, so any ref passed
in is overwritten: a Button can't be a Keymap target (0141) or be focused by an
app. Found while building Keymap.

## Acceptance criteria

- [x] A caller's ref (object or callback) reaches the button element alongside Button's own
- [x] A story focuses a Button through its ref and binds it as a Keymap target

## 2026-10-03

Landed in #143 (c7fc830). The Keymap 'Announced on its target' story that binds it as a target is on #145, which merges main and closes this.

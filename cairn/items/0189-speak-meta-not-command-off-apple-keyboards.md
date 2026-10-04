---
id: 189
uid: ec1c5a02-5735-409f-ac03-afe0988c2065
title: Speak Meta, not Command, off Apple keyboards
type: bug
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 132
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
priority: p3
layer: components
effort: s
---

## What happens

`spokenKeys` calls the meta key "Command" everywhere, so `meta+k` is announced
as "Command K" on Windows and Linux.

## Acceptance criteria

- [x] The spoken form follows the platform, with a Node test per platform

## 2026-10-03

spokenKeys now takes its modifier words from a table per platform: Apple says Command and Option (the words on its keys), anyone else says Meta and Alt. Meta, not Windows or Super, because the cap varies by keyboard and Meta is what aria-keyshortcuts and KeyboardEvent call it. Option on Apple is beyond the ticket's letter but the same bug: Alt was the one Apple key spoken by a name it does not print. mod is unchanged: it resolves to Control off Apple before speaking.

## Result

spokenKeys speaks the modifiers by the keyboard: Command and Option on Apple, Meta and Alt elsewhere; a Node snapshot per platform.

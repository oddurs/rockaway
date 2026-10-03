---
id: 189
uid: ec1c5a02-5735-409f-ac03-afe0988c2065
title: Speak Meta, not Command, off Apple keyboards
type: bug
status: backlog
milestone: primitives
depends_on:
- 132
created: 2026-10-03
updated: 2026-10-03
priority: p3
layer: components
effort: s
---

## What happens

`spokenKeys` calls the meta key "Command" everywhere, so `meta+k` is announced
as "Command K" on Windows and Linux.

## Acceptance criteria

- [ ] The spoken form follows the platform, with a Node test per platform

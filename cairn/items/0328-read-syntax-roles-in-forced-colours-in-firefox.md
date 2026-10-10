---
id: 328
uid: 607b54be-d0d8-4a3b-bbea-fa7101da7776
title: Read syntax roles in forced colours in Firefox
type: bug
status: backlog
milestone: primitives
created: 2026-10-09
updated: 2026-10-09
priority: p2
layer: css
effort: s
---

## What happens

"CodeBlock: Forced colors" fails axe in Firefox only. Playwright's Firefox emulation of forced colours leaves the author's `#3399ff` on syntax tokens, 2.94:1 on white. QA added a known entry, `firefox-forced-syntax`, scoped to `forced-colors-firefox` (#162).

## What should happen

Either `syntax.css` sets each role to `CanvasText` under `forced-colors: active`, which real Firefox would do itself, or the emulation limit is accepted and written down. Whichever is chosen, the known entry comes off.

## Acceptance criteria

- [ ] A CanvasText rule is tried in Firefox's forced-colours project, and the result is noted.
- [ ] `firefox-forced-syntax` is removed from `known.ts`, or kept with the reason it is permanent.

---
id: 214
uid: 918c5102-d567-4371-a71f-cba4bb847f3c
title: Corners meet under forced colours in Firefox
type: bug
status: review
milestone: primitives
assignee: Oddur Sigurdsson
claimed: 2026-10-03
depends_on:
- 117
created: 2026-10-03
updated: 2026-10-03
priority: p2
layer: css
effort: s
---

## What happens

Under forced colours in Firefox the east stroke of `┌` and `╔` at 0,0 stops short
of the cell edge. Known entry `firefox-forced-corners` (0124).

## Acceptance criteria

- [ ] Corners meet their neighbours under forced colours in Firefox, and the entry is removed

## 2026-10-03

Cause: under forced colours the browser draws a Canvas backplate behind text that keeps the adjustment, and Firefox draws it a pixel or so wider than the text's cells, over the last pixels of the corner before a title (and of a rule before a divider's label). Fix: [data-rk-shape] gets position: relative inside the forced-colors media query, so stroke cells paint after the row's unpositioned runs and their backplates; the content layer still paints over the chrome (later in tree order). Proved locally in Firefox with an untracked engine config: forced-colors project, all eleven forced-colours story files. On main, ForcedColors/Strokes (┌ and ╔ at 0,0) and Divider/Forced colors fail; with the change both pass. ForcedColors/Active still fails: that is firefox-forced-highlight (0215). Chromium forced-colors: 13/13 pass. The firefox-forced-corners entry lives only on the unmerged test/three-engines branch, which should drop it.

---
id: 342
uid: b3782159-0054-4043-ba8f-328ed8ce79de
title: Fix the Firefox flake in Screenshot's 'Reading changes nothing'
type: bug
status: backlog
milestone: v0.1
created: 2026-10-10
updated: 2026-10-10
priority: p2
layer: tooling
---

Firefox fails `src/grid/Screenshot.stories.tsx > Reading changes nothing` on unrelated PRs (#221 and #245, 2026-10-10) and passes on a rerun and locally (8/8). Find what the reading races with, likely fonts or a late layout, and settle on it rather than retrying.

## Acceptance criteria

- [x] The cause is named in a note
- [ ] The story passes 20 runs in a row in Firefox in CI

## 2026-10-10

Cause: the story watched the whole document for one task around a screenshot, while the screen could still be doing its own late work (a repaint after measuring, a resize). Seen in Firefox (#221, #245) and WebKit (main dfac1e36). The fix waits for a page at rest first, two frames with no change, and only then holds the reading to no change. Criterion 2 waits on CI runs.

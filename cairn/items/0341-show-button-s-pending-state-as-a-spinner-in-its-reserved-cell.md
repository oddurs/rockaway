---
id: 341
uid: bb95498b-2c9d-4e35-8484-195b6c09e183
title: Show Button's pending state as a Spinner in its reserved cell
type: feature
status: backlog
milestone: primitives
created: 2026-10-10
updated: 2026-10-10
priority: p2
layer: components
---

Button gains `isPending` (React Aria's), which shows the Spinner (0101) in the cell Button already reserves for it, so the label never moves. Moved here from 0101's criterion 22, which #188 did not do and 0131 closed without.

## Acceptance criteria

- [ ] `isPending` shows the Spinner in the reserved cell; the button's size in cells does not change
- [ ] The pending state is announced, and the button stays focusable but not pressable
- [ ] Reduced motion shows a still mark, not a spinning one (0283)
- [ ] Stories and snapshots cover pending in every variant

---
id: 157
uid: 10b76a68-e2aa-47e4-b31f-e3a490dcf5a0
title: Walk every component with VoiceOver and NVDA, and record what is heard
type: chore
status: backlog
milestone: v0.1
labels:
- needs-owner
depends_on:
- 142
created: 2026-10-03
updated: 2026-10-03
priority: p1
layer: components
effort: m
---

**Needs the human owner**, or someone they choose: NVDA runs on Windows, and a
judgement about what a screen reader user experiences should be made by a
person using one.

## Problem

axe checks rules; it cannot hear. The system's central accessibility claim is
that a reader hears a button, not `┌────┐`. That claim should be listened to.

## Acceptance criteria

- [ ] Every component walked with VoiceOver (macOS and iOS) and NVDA (Windows, Firefox and Chrome)
- [ ] What is announced for each state is recorded in the component's metadata, and on its site page
- [ ] No glyph is ever announced; any that is becomes a `bug` linked here

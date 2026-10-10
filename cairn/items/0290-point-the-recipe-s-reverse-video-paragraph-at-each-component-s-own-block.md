---
id: 290
uid: b6ceb52c-766a-4578-8157-ac09cd7fcdae
title: Point the recipe's reverse-video paragraph at each component's own block
type: docs
status: done
milestone: primitives
assignee: Oddur Sigurdsson
created: 2026-10-09
updated: 2026-10-09
closed_at: 2026-10-09
priority: p3
layer: docs
effort: s
---

## Purpose

Since 0202 and 0236 a reversal opts out in the component's own forced-colours block and sets --rk-forced-ink; the recipe still names the shared block.

## 2026-10-09

The paragraph now says the component's own stylesheet opts its reversed state out, with --rk-forced-ink: Canvas (0236), with List's block as the example, that reverse-opt-out.test.ts holds it to both, and that forced-colors.css keeps only what the base reverses.

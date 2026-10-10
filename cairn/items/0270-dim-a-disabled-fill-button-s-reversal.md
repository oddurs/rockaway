---
id: 270
uid: c89a6b65-315d-4d74-a818-7d032a7e50a8
title: Dim a disabled fill Button's reversal
type: bug
status: done
milestone: primitives
assignee: Oddur Sigurdsson
created: 2026-10-09
updated: 2026-10-09
closed_at: 2026-10-09
priority: p2
layer: components
effort: s
---

## Purpose

A disabled variant="fill" Button drew as solid reverse video, so it read as enabled. Give it a distinct, colour-free look within the state vocabulary, surviving forced colours. In #197.

## 2026-10-09

In #197: .rk-button[data-variant=fill][data-disabled] keeps the reversal and dims it, fg.disabled behind bg.page; GrayText behind Canvas in forced colours, in the forced opt-out with --rk-forced-ink. Stories: Disabled fill, its dark and forced-colours twins.

---
id: 245
uid: 02d96055-1996-405e-bac7-bc614baadfb7
title: Stop Fieldset's frame leaking above its corner at dense on macOS
type: bug
status: doing
milestone: grid
assignee: Oddur Sigurdsson
claimed: 2026-10-03
created: 2026-10-03
updated: 2026-10-03
priority: p3
layer: grid
effort: s
---

## Purpose

Fieldset's Painters story leaks ink above its top-left corner at dense on macOS; Linux CI does not see it, so it cannot be a known entry without going stale. Reproduce on macOS fonts and fix at the cause. Found by QA in 0199.

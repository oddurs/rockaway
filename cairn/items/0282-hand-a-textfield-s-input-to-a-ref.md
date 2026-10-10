---
id: 282
uid: 9d491d13-2033-4ecf-b170-819e3743c991
title: Hand a TextField's input to a ref
type: feature
status: done
milestone: primitives
assignee: Oddur Sigurdsson
created: 2026-10-09
updated: 2026-10-09
closed_at: 2026-10-09
priority: p3
layer: components
effort: s
---

## Purpose

TextField exposed no ref to its input, so a shortcut couldn't focus it. inputRef reaches the input or textarea. In #211.

## Result

TextField takes inputRef: a ref, object or callback, to its <input>, or its <textarea> when multiline, set beside the field's own ref (useBothRefs, shared with Button in src/refs.ts). An app can focus the box, select its text or read its caret.

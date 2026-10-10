---
id: 276
uid: 9df62b91-6b5f-468a-8d80-febf394d7ef1
title: Keep CodeBlock's overflow marks under a modal
type: bug
status: done
milestone: primitives
assignee: Oddur Sigurdsson
created: 2026-10-09
updated: 2026-10-09
closed_at: 2026-10-09
priority: p1
layer: components
effort: s
---

## Purpose

CodeBlock's sticky ‹ › marks painted over an open Dialog's backdrop. Keep the marks inside the screen's own stacking context, with a story under an open Dialog.

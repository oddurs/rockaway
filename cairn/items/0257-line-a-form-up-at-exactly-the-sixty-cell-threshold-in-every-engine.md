---
id: 257
uid: b4e8293e-beeb-4fbb-ac48-83a7cad516e5
title: Line a form up at exactly the sixty-cell threshold in every engine
type: bug
status: ready
milestone: primitives
created: 2026-10-04
updated: 2026-10-04
priority: p2
layer: css
effort: s
---

## Purpose

WebKit matches @container rk-form (width < 60ch) for a form exactly 60ch wide, so it stacks where Chromium and Firefox do not (known webkit-form-at-sixty). Compare at a whole-cell boundary that every engine resolves the same. QA has it in #182.

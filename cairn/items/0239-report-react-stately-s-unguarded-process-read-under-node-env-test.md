---
id: 239
uid: d5707f76-b84d-444b-b24c-74fff481564e
title: Report react-stately's unguarded process read under NODE_ENV=test
type: chore
status: ready
milestone: later
created: 2026-10-03
updated: 2026-10-03
priority: p3
layer: components
effort: s
---

## Purpose

react-stately 3.50.0 reads process.env.VIRT_ON in dist/private/virtualizer/Virtualizer.mjs:144 and Rect.mjs:61, which throws in a real browser whenever a bundler sets NODE_ENV=test. Ask upstream for a typeof process guard (posting needs the owner's go-ahead), link it from List's knownIssues, and drop the workbench shim and that entry once a fixed release lands.

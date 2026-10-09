---
id: 240
uid: 83f0cf79-b128-47f4-983b-c4045b2abf32
title: Make KeyHint phrasing content, so it can sit inside a paragraph
type: bug
status: done
milestone: primitives
assignee: Oddur Sigurdsson
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
priority: p2
layer: components
effort: s
---

## Purpose

KeyHint renders a hidden div, so a KeyHint inside a <p> is invalid HTML and a hydration error. Render only phrasing content (spans), and add a story with a KeyHint inside prose. Found by the tokens engineer building the registry (0046).

## 2026-10-03

The hidden div was React Aria's VisuallyHidden, a div by default. Link had the same bug for its new-tab notice, which is worse, since links sit in prose more than anything; Table's hidden cell text was a div in a span too. All three render a span now. phrasing.test.ts fails anything outside HTML's phrasing content in the server markup of Badge, Button, KeyHint and Link, and Grid/Phrasing parses each inside a <p> as a whole page is parsed (not innerHTML, which keeps the div) and hydrates it. On main the key hint splits the paragraph into four elements.

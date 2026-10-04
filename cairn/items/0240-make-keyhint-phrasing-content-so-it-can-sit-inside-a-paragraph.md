---
id: 240
uid: 83f0cf79-b128-47f4-983b-c4045b2abf32
title: Make KeyHint phrasing content, so it can sit inside a paragraph
type: bug
status: ready
milestone: primitives
created: 2026-10-03
updated: 2026-10-03
priority: p2
layer: components
effort: s
---

## Purpose

KeyHint renders a hidden div, so a KeyHint inside a <p> is invalid HTML and a hydration error. Render only phrasing content (spans), and add a story with a KeyHint inside prose. Found by the tokens engineer building the registry (0046).

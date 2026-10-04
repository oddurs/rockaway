---
id: 231
uid: e3e393ff-9672-44d6-8b70-68a1d1df7aa6
title: Use the theme's ellipsis in the DOM
type: feature
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 119
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
priority: p3
layer: components
effort: s
---

## Problem

Tree, List and Link cut text with CSS `text-overflow: ellipsis`, which draws the
font's `…` even under an ASCII theme.

## Acceptance criteria

- [x] Every cut in the DOM uses the theme's ellipsis, and an ASCII story proves no `…` appears

## 2026-10-03

On main only Tree cut with text-overflow: ellipsis. List clips with no ellipsis, as listBuffer models it (ellipsis ''), and Link does not cut; the Link cut on feat/site-shell should use the same useCut when it lands. Tree: the label holds its whole title in an inner span (found, copied, announced in full); useCut (src/cut.ts) marks it data-rk-cut while the text is wider than the label, and tree.css gives an ::after the label's last cell with content attr(data-rk-ellipsis), the theme glyph from useGlyphs, so a GlyphProvider reaches it where the CSS variable does not. The mark is sized unconditionally and the state only sets its content, so no state rule sets geometry. screenshot() writes the mark in that cell, and readScreen reads through screenshot(). Stories: Long labels and Long labels, ASCII theme check the row cell for cell against treeBuffer at the tree's width, the ::after content, and no … anywhere under ASCII; they pass in Chromium (all projects), WebKit and Firefox. No script: the label clips at its edge.

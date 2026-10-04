---
id: 201
uid: ea1fb999-916b-4d99-9b6d-c52d50ddcce2
title: Check that every reversing rule opts out of the forced-colors backplate
type: chore
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 181
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
priority: p2
layer: tooling
effort: s
---

## Problem

In forced colors Chromium paints a Canvas backplate behind text unless the
element opts out, so reverse video vanishes (0181). The opt-out list in
`forced-colors.css` is kept by hand; the next component that reverses
something will silently disappear.

## Acceptance criteria

- [x] A Node test finds every component rule that swaps figure and ground or reads the inverse pair, and fails if the opt-out does not cover it

## 2026-10-03

packages/css/test/reverse-opt-out.test.ts parses every stylesheet in @rockaway/css with postcss. A rule reverses when it draws words in a ground colour: its color reads --rk-bg-* or --rk-fg-on-*, directly or through a custom property of the sheet that a color reads. That covers Badge-style tone properties. Opt-outs are rules with forced-color-adjust: none inside a forced-colors media query, in any file. An opt-out covers a rule when every simple selector of its last compound is in the rule's, so .rk-button[data-pressed] covers danger's pressed state. Fixture tests prove it fails a direct reversal, one through a custom property, and one only an attribute selector containing ~ could seem to cover; the first version split on that ~ as a combinator and let everything through. On its first real run it found [data-rk-fill]:focus-visible (focus.css) uncovered: a focused filled control's words vanished in forced colors. That is now in the opt-out list, with a Forced colors > Filled focus story that fails in pixels without it.

## Result

packages/css/test/reverse-opt-out.test.ts fails any rule that draws words in a ground colour without a forced-colors opt-out covering it; it found and fixed [data-rk-fill]:focus-visible.

## 2026-10-03

After main merged in, the check went red on a real bug: Tree (#122) reversed a selected row, .rk-tree-item[data-selected], without opting out, so selected tree rows vanished in forced colors. Added to the opt-out. A screenshot showed a second problem the CSS check cannot see: the row's guides are shapes the cell draws, and forced colors inks every shape in CanvasText, the very ground the row is reversed onto. tree.css now inks a selected row's guides in Canvas under forced colors. Forced colors > Reverse video checks the tree row's words and each guide cell in pixels. A one-line cell leaks about 4% canvas-coloured pixels at its edges even when the line is invisible, and a visible line shows 8% or more, so the guide check asks for more than 6%; it fails without the fix (0.04).

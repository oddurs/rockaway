---
id: 190
uid: 0a353128-02ba-46a4-a1f2-22ff940c8cee
title: Show attributes of real elements in screenshot()'s legend
type: feature
status: done
milestone: primitives
assignee: Oddur Sigurdsson
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
priority: p3
layer: tooling
effort: s
---

## Problem

The legend lists attributes of painted runs only, so reverse video and underline
on real elements (List rows, Link) never appear in a text snapshot.

## Acceptance criteria

- [x] The legend reads computed decoration and swapped colours on real elements

## 2026-10-03

screenshot() reads a real element's attributes when no painted run says them. Bold: font-weight 600 or more where the screen's is under. Underline: text-decoration-line on the element or an ancestor it inherits decoration from, stopping at an inline-block or a box out of flow, where decorations stop propagating. Reverse: the words sit on a ground of their own inside the screen and are drawn in the colour of the ground beneath it, so a selected List row is reversed and a tinted Badge is not. No existing story's snapshot changed. Grid > Screenshot > Lists the attributes of real elements covers a selected row, a Link, strong text, an unselected row and a tinted Badge. Dim is not read: it is a colour on real elements, and telling a dimmed colour from any other needs the token, which is a separate question.

## Result

screenshot()'s legend reads bold, reverse and underline from computed style on real elements, so List rows and Links show their attributes in a text snapshot.

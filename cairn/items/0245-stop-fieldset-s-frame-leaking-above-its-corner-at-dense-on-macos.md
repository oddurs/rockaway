---
id: 245
uid: 02d96055-1996-405e-bac7-bc614baadfb7
title: Stop Fieldset's frame leaking above its corner at dense on macOS
type: bug
status: done
milestone: grid
assignee: Oddur Sigurdsson
created: 2026-10-03
updated: 2026-10-10
closed_at: 2026-10-10
priority: p3
layer: grid
effort: s
---

## Purpose

Fieldset's Painters story leaks ink above its top-left corner at dense on macOS; Linux CI does not see it, so it cannot be a known entry without going stale. Reproduce on macOS fonts and fix at the cause. Found by QA in 0199.

## 2026-10-03

Reproduced on macOS only with #144 (screen remeasure) merged in, since main still skips dense for screens with cols/rows through the screen-remeasure known entry. The ink was not the fieldset's: it was the descender of the 'g' in the outer Frame's title 'glyph'. At dense the line box is the font size, SF Mono's descent is deeper than that, and the fieldset's top row starts right under the title row, so its corner cell held another screen's letter (a title without descenders: no leak). Linux fonts' descent fits. The rendering is what dense is (0116); the defect was in the check: a screenshot of one painted layer held every other layer's ink in that rect. checkContinuity now hides every other painted layer while it captures one, as it already hid the content laid over it; the ground is read from the layer's own ancestors, which are untouched. Regression: Continuity 'Overlapping screens' (two screens overlapping by half a row) fails without the fix on any font. Fieldset and Continuity pass with #144 merged locally.

## 2026-10-10

On main: the fix was in the check, not the rendering; a layer's chrome is read with every letter transparent (#222). Closed from review.

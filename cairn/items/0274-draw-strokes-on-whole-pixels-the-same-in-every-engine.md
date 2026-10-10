---
id: 274
uid: 374b4442-e913-4809-a84c-ff438bba4d83
title: Draw strokes on whole pixels, the same in every engine
type: bug
status: done
milestone: grid
assignee: Oddur Sigurdsson
created: 2026-10-09
updated: 2026-10-09
closed_at: 2026-10-09
priority: p2
layer: css
effort: m
---

## Purpose

At 1× Firefox and WebKit drew the 1.28px light stroke 2 device pixels wide, Chromium 1. Decide a rounding rule and prove it by pixel measurement in all three. In #203.

## 2026-10-09

The rule (#203): a stroke is a whole number of CSS pixels, at least one, and every mark inside a cell starts on a whole pixel; full-length layers keep their percentage and overshoot. An integer-wide layer at an integer offset leaves no engine anything to snap. Proved by Grid / Continuity / A stroke is whole device pixels: on main Firefox drew ─ 2px at 3 of 8 sizes and offsets, WebKit │ or ─ 2px at 4 of 8; with the rule all three draw 1px everywhere, and 2 device pixels in the zoom browser.

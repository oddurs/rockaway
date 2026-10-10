---
id: 274
uid: 374b4442-e913-4809-a84c-ff438bba4d83
title: Draw strokes on whole pixels, the same in every engine
type: bug
status: ready
milestone: grid
created: 2026-10-09
updated: 2026-10-09
priority: p2
layer: css
effort: m
---

## Purpose

At 1× Firefox and WebKit drew the 1.28px light stroke 2 device pixels wide, Chromium 1. Decide a rounding rule and prove it by pixel measurement in all three. In #203.

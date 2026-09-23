---
id: 26
title: Build focus ring, motion and reduced-motion foundations
type: feature
status: done
milestone: runtime
assignee: Oddur Sigurdsson
depends_on:
- 24
- 61
created: 2026-09-22
updated: 2026-09-22
priority: p1
layer: css
effort: s
---

## Problem

## Proposal

## Acceptance criteria

- [x] One focus treatment for everything, on `:focus-visible` only (0061)
- [x] The ring survives `overflow: hidden` and follows the border radius
- [x] Reduced motion collapses the duration tokens and stops animation already written in CSS
- [x] Reduced motion comes from the system setting and from an in-app `data-motion` setting

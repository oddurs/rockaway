---
id: abef3daf-68ba-46b9-93a2-f1729fd5eab5
title: Build focus ring, motion and reduced-motion foundations
type: feature
status: done
milestone: runtime
assignee: Oddur Sigurdsson
depends_on:
- e6ee56dd-75d9-4e6c-8a3b-2c1b3654a64e
- 11a80c31-06e2-48ef-80e3-81678841c54e
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

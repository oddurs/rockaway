---
id: 268
uid: 8489c935-e468-4c6b-a829-63dacb773ae6
title: Read what a pseudo-element draws when copying a screen
type: feature
status: ready
milestone: primitives
created: 2026-10-04
updated: 2026-10-04
priority: p3
layer: tooling
effort: m
---

## Purpose

readScreen and screenshot() read the DOM, so Prose's heading underlines and blockquote bar (drawn by ::before/::after) copy as blank. Let the system declare the cells a pseudo-element paints.

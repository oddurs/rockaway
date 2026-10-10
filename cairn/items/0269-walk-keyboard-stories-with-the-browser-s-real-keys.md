---
id: 269
uid: d8da202d-66b2-4a06-8b56-83b02121502e
title: Walk keyboard stories with the browser's real keys
type: chore
status: ready
milestone: primitives
created: 2026-10-09
updated: 2026-10-09
priority: p2
layer: tooling
effort: s
---

## Purpose

Storybook's userEvent sends synthetic events, which hid TextField dropping every real keystroke. Every keyboard step goes through keys.ts (press, tab, click) on the runner's trusted input, and a real click comes before real keys. Done in #199.

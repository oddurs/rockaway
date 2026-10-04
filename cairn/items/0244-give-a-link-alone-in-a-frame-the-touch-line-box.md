---
id: 244
uid: dffa6e36-89b3-4863-afc2-4988d44101ee
title: Give a link alone in a frame the touch line box
type: bug
status: ready
milestone: primitives
created: 2026-10-03
updated: 2026-10-03
priority: p2
layer: components
effort: s
---

## Purpose

At touch density a standalone link inside a frame is an 18px inline box instead of the 44px line box, so it fails the target-size check (known entry standalone-link-touch). Found by QA in 0199.

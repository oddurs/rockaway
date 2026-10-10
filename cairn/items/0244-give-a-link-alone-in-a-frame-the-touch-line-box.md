---
id: 244
uid: dffa6e36-89b3-4863-afc2-4988d44101ee
title: Give a link alone in a frame the touch line box
type: bug
status: done
milestone: primitives
assignee: Oddur Sigurdsson
created: 2026-10-03
updated: 2026-10-09
closed_at: 2026-10-09
priority: p2
layer: components
effort: s
---

## Purpose

At touch density a standalone link inside a frame is an 18px inline box instead of the 44px line box, so it fails the target-size check (known entry standalone-link-touch). Found by QA in 0199.

## 2026-10-03

A link is alone when its parent's text is its own: Link reads that after each render and writes data-rk-alone (data-rk-, because metadata.test.ts refuses a stylesheet attribute that is neither a state nor a variant, and this is a layout fact). link.css draws it as an inline block, whose height is the line box: a whole cell, 44px at touch. In a sentence it stays inline, wraps with its words, and keeps WCAG's exemption. The 'Alone, at touch' story asserts both, with checkTargets at minHeight 44; it fails with the rule removed (19px short). The attribute arrives at hydration, so a page with no script still has the 18px box. The known entry standalone-link-touch lives on fix/screen-remeasure (0199), not on main: whichever of the two lands second must delete it, or the stale-entry check fails the full run.

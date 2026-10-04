---
id: 238
uid: ab4611b8-90f9-417d-a311-67db25f3ddc8
title: Size a server-rendered screen from its content, not Screen's fallback
type: bug
status: ready
milestone: primitives
created: 2026-10-03
updated: 2026-10-03
priority: p1
layer: components
effort: m
---

## Purpose

A content-sized Screen (Callout first) renders at Screen's 80×24 fallback on the server, so a one-line callout without JavaScript is about twenty rows and shrinks on hydration: a layout shift across the page. Count rows on the server with wrap() at the fallback width, or take a rows hint, and prove server height equals hydrated height. Found by the site lead in 0147; in progress as #156.

---
id: 238
uid: ab4611b8-90f9-417d-a311-67db25f3ddc8
title: Size a server-rendered screen from its content, not Screen's fallback
type: bug
status: done
milestone: primitives
assignee: Oddur Sigurdsson
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
priority: p1
layer: components
effort: m
---

## Purpose

A content-sized Screen (Callout first) renders at Screen's 80×24 fallback on the server, so a one-line callout without JavaScript is about twenty rows and shrinks on hydration: a layout shift across the page. Count rows on the server with wrap() at the fallback width, or take a rows hint, and prove server height equals hydrated height. Found by the site lead in 0147; in progress as #156.

## 2026-10-03

Neither suggested fix: wrap() at a fallback width is right at that width only, and a rows hint is a guess. Instead a screen that has not measured draws its smallest box (each component passes it as fallback: Callout and Fieldset from their heading, Frame from its title and dividers, Divider from its label) and stretches the last row and column but one to its box with flex (data-rk-elastic, data-rk-stretch). The no-JS frame is then the measured size at any width. Measuring components: Callout, Fieldset, Frame without cols/rows, Divider; Table is sized in cells. Grid/Server size compares renderToString output to the live component for five cases, size and chrome edges; it fails without the change. Also fixed: Callout's frame was drawn under its content's ground and never showed.

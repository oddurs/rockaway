---
id: 287
uid: fac188cb-f27c-4b78-a76d-373951e1d5d1
title: Make the docs' left navigation a sidebar worth using
type: feature
status: doing
milestone: site
assignee: Oddur Sigurdsson
claimed: 2026-10-09
created: 2026-10-09
updated: 2026-10-09
priority: p0
layer: site
effort: l
---

## Purpose

The docs app's left Tree as a real app sidebar: collapsible sections with counts, remembered; the path to the current page marked; its own keymap pane (g n, j/k, left/right, / to filter); badges; a drawer when narrow. Owner request.

## 2026-10-09

apps/web: the map is server markup with LinkTree's classes, its guides and marks drawn once per glyph set. Sections (Guides, Components) open and shut from a mark cell, with their page counts; shut sections are an attribute on <html> the head's script restores, so nothing moves. The row you are on is reverse video, marked before first paint by an inline script and kept in the map's view; each section above it is bold. Keys (loaded when idle): g n to the map, j/k between its rows when it has focus, left/right shut and open a section, / to find a page (Enter goes to the first page whose name matches), [ hides the map (on a phone it is a drawer over the page, from the status bar's '[ map'), ] hides the outline, which marks the section you are reading. Not done: badges, which need metadata to say what a badge means (new, status).

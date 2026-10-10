---
id: 281
uid: 0547dd86-574b-4827-aa68-9d665c592038
title: Show a Table's rows in a window that follows the cursor
type: feature
status: done
milestone: primitives
assignee: Oddur Sigurdsson
created: 2026-10-09
updated: 2026-10-09
closed_at: 2026-10-09
priority: p2
layer: components
effort: m
---

## Purpose

Table has no visible-rows option, so an app counts chrome by hand to fit rows in a Pane. A rows prop that scrolls with the cursor.

## 2026-10-09

In #216: rows={n} on Table. The body is n rows tall and scrolls in whole rows (scroll-snap), React Aria brings the focused row into view so the window follows the cursor, and List's scrollbarBuffer is drawn in a cell inside the right edge (tableLayout scrollbar option). The scroll is read in the capture phase on the table, since the body is the caller's element drawn after the screen measures. tableBuffer takes visible and offset. Server draws the window's height and the scrollbar.

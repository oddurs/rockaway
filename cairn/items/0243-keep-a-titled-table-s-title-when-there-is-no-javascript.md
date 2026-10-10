---
id: 243
uid: d7978d22-d5c7-4765-957c-aa9588792df5
title: Keep a titled Table's title when there is no JavaScript
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

Table learned its columns only from React Aria's collection in an effect, so the server drew a two-cell frame with no columns, rules or title: "Name ▴ Size" without script, "files Name ▴ Size" with it. Read columns and rows from the elements given, so the server and the first paint agree with the client. Found by the site lead in 0147; in progress as #160.

## 2026-10-03

Done in #160. #156's elastic chrome is for page-sized screens; Table is sized in cells but cannot count them until it knows its columns, so it now reads columns (words, width, align, sorting) and rows (static, or a body of items rendered by a function) from the elements it is given, before it draws, in the same shape Measure reads the collection; the client's first measurement agrees, so hydration moves nothing, and Measure keeps the last word for collections it cannot read (columns from a function). A header finds its index in the collection by its words until the DOM says. Two Node tests render a table to a string, never hydrated, and hold its chrome to the model, title and rules included.

## Result

Table draws its real columns, rules and title on the server and in the first paint, read from its elements; held by Node tests that never hydrate.

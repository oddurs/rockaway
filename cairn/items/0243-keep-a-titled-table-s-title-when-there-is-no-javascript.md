---
id: 243
uid: d7978d22-d5c7-4765-957c-aa9588792df5
title: Keep a titled Table's title when there is no JavaScript
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

Table learned its columns only from React Aria's collection in an effect, so the server drew a two-cell frame with no columns, rules or title: "Name ▴ Size" without script, "files Name ▴ Size" with it. Read columns and rows from the elements given, so the server and the first paint agree with the client. Found by the site lead in 0147; in progress as #160.

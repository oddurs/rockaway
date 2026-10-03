---
id: 169
uid: c8a62899-c12b-4397-829b-8cb01e2f8bbc
title: Give inline controls a full-cell hit area and ground
type: feature
status: backlog
milestone: primitives
depends_on:
- 117
created: 2026-10-03
updated: 2026-10-03
priority: p3
layer: css
effort: s
---

## Problem

An inline link's background and hit area are the font's content area, not the
cell, so its pressed reverse video does not fill the row. 0117 may settle this
for painted cells; inline real elements need their own answer.

## Acceptance criteria

- [ ] A pressed inline Link fills its whole cells, at every density
- [ ] Its hit area is the cell height, without moving the text

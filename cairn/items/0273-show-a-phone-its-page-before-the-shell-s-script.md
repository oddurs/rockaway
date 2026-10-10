---
id: 273
uid: 1f240966-104e-4c41-be65-e9ebc08b2530
title: Show a phone its page before the shell's script
type: bug
status: ready
milestone: site
created: 2026-10-09
updated: 2026-10-09
priority: p1
layer: site
effort: m
---

## Purpose

On Slow 4G the site painted blank until the shell measured (~944ms landing). The server places the page pane where the script will, so a phone shows content at ~550ms with zero layout shift. On feat/cards.

---
id: 304
uid: ba1dfdf4-05e5-4150-acc8-1ebe5d60f455
title: Build the site as one Next.js app
type: decision
status: done
milestone: site
created: 2026-10-09
updated: 2026-10-10
closed_at: 2026-10-10
priority: p0
layer: site
effort: s
---

## Purpose

A Next.js App Router app with one persistent shell (sidebar, page, outline, status bar), home inside it, exported statically under /rockaway, never reloading between pages. Supersedes 0258 and 0288. Owner direction.

## 2026-10-10

Landed in #245: apps/web replaces apps/site, which is deleted; CI builds, tests and budgets apps/web (140.5 kB shared first-load JS, CLS 0 at four widths on fast and Slow 4G).

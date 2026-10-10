---
id: 261
uid: 6a72a156-95e8-4033-bdfd-9887bb293aec
title: Read a screen without changing the document
type: bug
status: done
milestone: primitives
assignee: Oddur Sigurdsson
created: 2026-10-04
updated: 2026-10-09
closed_at: 2026-10-09
priority: p1
layer: tooling
effort: s
---

## Purpose

cellOf() appended and removed a probe, so a waitFor around screenshot() or a conformance check re-triggered itself in microtasks and hung the whole run instead of failing. Read the cell custom properties once measured, prove reading leaves no mutation records, and add a per-test watchdog. Found through 0216; fixed in #192.

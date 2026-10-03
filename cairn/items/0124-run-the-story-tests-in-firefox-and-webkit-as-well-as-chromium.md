---
id: 124
uid: e7288c0c-adba-45d8-9122-a4536b049934
title: Run the story tests in Firefox and WebKit as well as Chromium
type: chore
status: backlog
milestone: primitives
depends_on:
- 13
created: 2026-10-03
updated: 2026-10-03
priority: p1
layer: tooling
effort: m
---

## Problem

Every story test, the conformance check and axe run in Chromium only. The
system's claims are about the cell (`1ch`, `1lh`, font metrics, line boxes),
which is exactly where engines differ, and the people this launches to use
Firefox and Safari in numbers.

## Acceptance criteria

- [ ] The workbench Vitest config has Chromium, Firefox and WebKit projects, and the forced-colors project stays Chromium-only with the reason written next to it
- [ ] CI installs all three browsers and runs every story in each, on every pull request
- [ ] Any engine difference that needs a tolerance or a skip is recorded here with a measurement, not hidden in a config
- [ ] CI wall time before and after is recorded here; if it doubles, Firefox and WebKit move to pushes to main and this item says so

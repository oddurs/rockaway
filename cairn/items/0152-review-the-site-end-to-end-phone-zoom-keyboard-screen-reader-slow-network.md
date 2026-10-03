---
id: 152
uid: 2c742ddc-d635-4612-989f-554747f9b128
title: 'Review the site end to end: phone, zoom, keyboard, screen reader, slow network'
type: chore
status: backlog
milestone: site
depends_on:
- 104
- 105
- 106
- 107
- 108
- 109
- 113
- 146
- 147
- 148
- 149
- 150
- 151
created: 2026-10-03
updated: 2026-10-03
priority: p0
layer: site
effort: m
---

## Problem

Each site item proves its own part. Nobody has used the whole site the way the
launch audience will: on a phone on a train, zoomed, from the keyboard, with a
screen reader, on a slow connection, in Firefox and Safari.

## Acceptance criteria

- [ ] Every page at 320px wide and at 400% zoom: no horizontal scroll except tables and code, nothing clipped
- [ ] The whole site navigated by keyboard alone, every route reached, focus always visible
- [ ] The landing page and one component page used with VoiceOver on iOS and macOS, findings recorded here
- [ ] First load on a throttled "Slow 4G" profile: the landing page's first paint and its live screen time recorded here
- [ ] Chromium, Firefox and Safari checked; any difference fixed or recorded
- [ ] Every finding fixed or filed as a `bug` linked here

---
id: 209
uid: 788202f4-ed8a-4f63-938c-f422917714e0
title: Link hover is bold, never a double underline
type: bug
status: backlog
milestone: primitives
depends_on:
- 135
created: 2026-10-03
updated: 2026-10-03
priority: p1
layer: css
effort: s
---

## What happens

Link is underlined at rest, so its hover rule turns the underline `double`
(0135's reading of 0118). The owner called it a bug, and it is: a terminal
cannot draw a double underline, so it is a web effect in a TUI system.

## What should happen

Hover on an element that is already underlined draws **bold**, an attribute a
terminal has and one that changes no width in a monospace face. No decoration is
ever doubled.

## Acceptance criteria

- [ ] `.rk-link[data-hovered]` is bold with its single underline; no rule anywhere sets `text-decoration-style: double`, and a test says so
- [ ] Hover stays distinct from current (bold, body colour and the cursor mark) in a greyscale screenshot
- [ ] 0118's hover row gains: on an element underlined at rest, hover is bold

---
id: 209
uid: 788202f4-ed8a-4f63-938c-f422917714e0
title: Link hover is bold, never a double underline
type: bug
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 135
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
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

- [x] `.rk-link[data-hovered]` is bold with its single underline; no rule anywhere sets `text-decoration-style: double`, and a test says so
- [x] Hover stays distinct from current (bold, body colour and the cursor mark) in a greyscale screenshot
- [x] 0118's hover row gains: on an element underlined at rest, hover is bold

## 2026-10-03

Hover is font-weight bold on .rk-link[data-hovered] and on .rk-prose a:hover, which had copied Link's double underline; the underline stays solid. linkStyle gives hover Attr.bold, so the text snapshot shows it. packages/css/test/no-double-underline.test.ts scans packages/css/src, packages/react/src, apps/site/src and apps/workbench/src for text-decoration(-style) double in CSS, Astro and inline styles, and proves it catches the longhand, the shorthand and a React inline style but not a double border. The Greyscale story hovers 'api' while 'guide' is current, and reads the row back with screenshot(): both are bold, and only the current page has the cursor mark. 0118's hover row and the metadata's state vocabulary now say: on an element underlined at rest, hover is bold, never a double underline.

## Result

Hover on an element underlined at rest is bold; nothing doubles an underline, and a test refuses it.

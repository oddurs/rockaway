---
id: 168
uid: 0efc371b-c51e-4dc9-84cf-9e4a283a0fb6
title: Re-export or document the router hook-up for Link
type: feature
status: backlog
milestone: primitives
depends_on:
- 135
created: 2026-10-03
updated: 2026-10-03
priority: p2
layer: components
effort: s
---

## Problem

Client-side routing needs React Aria's `RouterProvider` around the app, and
`@rockaway/react` does not say how. Raised by the Link engineer (0135).

## Acceptance criteria

- [ ] Either `RouterProvider` is re-exported with a one-line reason, or the docs show importing it from `react-aria-components`
- [ ] A story or the site uses it with a client router

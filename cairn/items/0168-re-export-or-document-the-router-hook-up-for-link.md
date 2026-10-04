---
id: 168
uid: 0efc371b-c51e-4dc9-84cf-9e4a283a0fb6
title: Re-export or document the router hook-up for Link
type: feature
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 135
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
priority: p2
layer: components
effort: s
---

## Problem

Client-side routing needs React Aria's `RouterProvider` around the app, and
`@rockaway/react` does not say how. Raised by the Link engineer (0135).

## Acceptance criteria

- [x] Either `RouterProvider` is re-exported with a one-line reason, or the docs show importing it from `react-aria-components`
- [x] A story or the site uses it with a client router

## 2026-10-03

Re-exported, not just documented: RouterProvider only works as the same module instance Link was built against. Under pnpm an app cannot import react-aria-components unless it depends on it itself, and if it does, a second copy gives a router context no Link reads. So it is exported from link.tsx (entries re-export only their own module) and listed in the link entry; metadata.test lists it with GlyphProvider as exported-but-not-a-component, with its reason, and Link's metadata notes say how to use it. The story Components/Link 'With a client router' uses a minimal router (a path in state, navigate = setPath, useHref adding a base path): click and Enter navigate without a page load, the href carries the base path, and aria-current follows.

## Result

RouterProvider is re-exported from @rockaway/react beside Link, with the reason in a comment; Link's notes document it; a Link story drives it with a client router.

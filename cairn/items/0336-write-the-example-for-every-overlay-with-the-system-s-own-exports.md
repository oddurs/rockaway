---
id: 336
uid: 63ff3250-9775-48d8-95ab-0bd3fb51984b
title: Write the example for every overlay with the system's own exports
type: chore
status: backlog
milestone: primitives
created: 2026-10-10
updated: 2026-10-10
priority: p3
layer: components
effort: s
---

## Purpose

The recipe says an example imports only `@rockaway/*` and React. Popover's example imports `Dialog` and `DialogTrigger` from react-aria-components, and others may too. Since #169, `DialogTrigger` and `TooltipTrigger` are re-exported beside their components. Write every overlay's example with the system's own exports, and have the metadata test fail an example that imports anything else.

## Acceptance criteria

- [ ] No `*.example.tsx` imports from react-aria-components.
- [ ] metadata.test.ts fails an example that imports anything but `@rockaway/*` and React.

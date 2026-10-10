---
id: 340
uid: 6828e98a-32a3-4981-9824-9bf4a21e531d
title: Place a popover again in WebKit after the density changes
type: bug
status: backlog
milestone: primitives
created: 2026-10-10
updated: 2026-10-10
priority: p1
layer: behaviour
effort: m
---

## What happens

In WebKit on Linux (CI), Overlay's Densities story switches the root from dense to airy with a popover open, and the popover stays on the trigger's row instead of the row under it ("airy: on the row under the trigger: expected 1 to be 2"), even given five seconds. Chromium and Firefox place it again, as 0246 (#223) does: `usePlaceOnMove` holds `shouldUpdatePosition` false for a frame when the trigger moves, then lets go, and React Aria places again. macOS WebKit passes. It surfaced when the stories began running in WebKit (#162).

## What should happen

The popover is on the row under its trigger, from its column, at every density, in every engine.

## Reproduction

1. Run Overlay's Densities story in the `webkit` project on Linux.
2. Find whether WebKit reports the trigger's move to the ResizeObserver on its screen, and whether React Aria re-runs its placement when `shouldUpdatePosition` flips.

## Acceptance criteria

- [ ] The cause is named in a note.
- [ ] The story's WebKit exception for airy comes off, and Densities passes in all three engines on Linux.

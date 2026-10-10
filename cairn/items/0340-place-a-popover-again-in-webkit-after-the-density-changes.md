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

## 2026-10-10

Seen again on main (run 38054664035, ef4bcc80, 2026-10-10), both passing on a rerun: Overlay's Densities in Firefox at airy (the popover on the trigger's row, expected the row under it), and Screen's Responds to a resize in WebKit at airy (a screen kept a 16px cell in a 32px line box: it did not remeasure when the context changed). The same family as this item: a remeasure after the switch to airy that lands late outside Chromium. The fix belongs in the remeasure, not in the stories.

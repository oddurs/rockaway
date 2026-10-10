---
id: 327
uid: 6084dd2e-dc85-4bba-aeab-4c2ac4ab90f4
title: Remeasure an overlay's screen when the density changes under CI load
type: bug
status: backlog
milestone: runtime
created: 2026-10-09
updated: 2026-10-09
priority: p2
layer: behaviour
effort: m
---

## What happens

The matrix's remeasure check sometimes fails in CI on Overlay's Densities story:

    at normal, light:
      div.rk-screen kept a 44px cell in a 24px line box: it did not remeasure when the context changed

The 44px cell is touch's. After the switch back to normal, the popover's Screen has not remeasured within the matrix's settle loop (`switchTo`, which stops after six still frames). Seen on runs 38014914435 (#232) and 38015073866 (#223). The story passed four runs out of four locally.

## What should happen

Every Screen's cell follows the line box it sits in within a frame or two of a context change, however loaded the machine is. If the remeasure is right and only slow, the matrix should wait for it rather than give up on six still frames.

## Reproduction

1. Run Overlay's Densities story in CI (`storybook` project) several times. It fails about one run in five on a loaded runner.
2. Find out whether the popover's probe (`1ch` × `1lh`, observed by a ResizeObserver) reported the change at all. A screen in a portal, or one hidden for a moment while the density flips, may miss it.

## Acceptance criteria

- [ ] The cause is found and named in a note.
- [ ] Overlay's Densities passes 20 runs in a row under `--repeat` with CPU throttling.

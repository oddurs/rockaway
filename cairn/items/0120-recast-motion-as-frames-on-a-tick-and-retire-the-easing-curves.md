---
id: 120
uid: 623e75ff-8653-48e3-9429-fce54798fcad
title: Recast motion as frames on a tick, and retire the easing curves
type: feature
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 75
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
priority: p1
layer: tokens
effort: s
---

## Problem

0075 decided motion becomes "frames on a tick: spinner 80ms, blink 500ms,
collapse on reduced motion". The generator still emits `motion.duration.fast`
/ `base` / `slow` and three cubic-bezier easings, and the README lists easing
curves among the things the system gives up. Progress (0101) needs a tick to
advance its frames, and has nothing to read.

## Proposal

Replace the durations and easings with tick tokens: `motion.tick.spinner`
(80ms), `motion.tick.blink` (500ms), `motion.tick.progress` (for an
indeterminate bar), and `motion.reduced` behaviour documented as "frames stop;
the first frame stays". A `useTick(name)` hook in `@rockaway/react` advances a
frame counter from the token, shares one timer per interval across a page, and
stops under `prefers-reduced-motion: reduce` and when the document is hidden.

## Acceptance criteria

- [x] `motion.duration.*` and `motion.easing.*` are no longer generated; the tick tokens are, and the generator's tests say why
- [x] No CSS in `@rockaway/css` uses a transition or an easing curve; a check fails the build if one appears
- [x] `useTick` shares one timer per interval, however many spinners are on the page, asserted in a test
- [x] Under reduced motion `useTick` returns a constant frame, and a story asserts the spinner does not change
- [x] A changeset records the break, with what to use instead

## 2026-10-03

Ticks: spinner 80ms and blink 500ms from 0075; progress 100ms (one cell per frame for an indeterminate bar) is my choice, and 0101 may tune it. The values live in a JS table (ticks) that the DTCG tokens are written from, like the glyphs in 0119: useTick reads the table, not the CSS, because a frame is chosen in JS and possibly on a server.

## 2026-10-03

useTick is useSyncExternalStore over one clock per interval: the first subscriber starts a setInterval, the last stops it, and every spinner on a page reads the same frame, so they step together. Reduced motion = data-motion=reduced on the root, or the system setting unless data-motion=full; it is watched live (matchMedia change, a MutationObserver on data-motion, visibilitychange), so switching it starts or stops the clock without a reload. Under reduced motion the snapshot is 0, the first frame. The server snapshot is 0 too, so hydration agrees.

## 2026-10-03

motion.css keeps its reduced-motion blanket over consumers' own animation (an !important 1ms duration and one iteration): it takes motion away, never adds it. The check (packages/react/test/no-motion-curves.test.ts, beside the variant-geometry check that also reads @rockaway/css) allows exactly that and rejects any other transition or animation property, any curve (cubic-bezier, steps, linear(), ease keywords), keyframes, and smooth scrolling.

## Result

Motion tokens are motion.tick.spinner (80ms), motion.tick.blink (500ms) and motion.tick.progress (100ms), exported to JS as ticks; durations and easings are gone. useTick(name, frames?) in @rockaway/react returns a frame counter on that tick, one shared timer per interval, stopped while hidden, and 0 (the first frame) under reduced motion, from the system setting or data-motion on the root. Nothing in @rockaway/css may transition or ease; a test enforces it.

---
id: 120
uid: 623e75ff-8653-48e3-9429-fce54798fcad
title: Recast motion as frames on a tick, and retire the easing curves
type: feature
status: backlog
milestone: primitives
depends_on:
- 75
created: 2026-10-03
updated: 2026-10-03
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

- [ ] `motion.duration.*` and `motion.easing.*` are no longer generated; the tick tokens are, and the generator's tests say why
- [ ] No CSS in `@rockaway/css` uses a transition or an easing curve; a check fails the build if one appears
- [ ] `useTick` shares one timer per interval, however many spinners are on the page, asserted in a test
- [ ] Under reduced motion `useTick` returns a constant frame, and a story asserts the spinner does not change
- [ ] A changeset records the break, with what to use instead

---
'@rockaway/tokens': major
'@rockaway/react': minor
'@rockaway/css': patch
---

Motion is frames on a tick. `motion.duration.fast`, `motion.duration.base`, `motion.duration.slow` and the three `motion.easing.*` curves are gone, and with them `--rk-motion-duration-*`, `--rk-motion-easing-*`, the Tailwind `ease-standard`, `ease-enter` and `ease-exit` utilities, and the `durations` and `easings` exports. In their place are `motion.tick.spinner` (80ms), `motion.tick.blink` (500ms) and `motion.tick.progress` (100ms), exported to JavaScript as `ticks`: how long each frame of a stepped animation holds.

Instead of transitioning a value, step through frames with `useTick(name, frames?)` from `@rockaway/react`: it returns a frame counter that advances on the named tick, `useTick('spinner', 10)` wrapping from 9 back to 0. Every component on a page shares one timer per interval. The timer stops while the document is hidden, and under reduced motion (the system setting, or `data-motion="reduced"` on the root) the frame is 0 and stays there.

`@rockaway/css` no longer collapses the duration tokens under reduced motion, because there are none to collapse. It still stops animation written in your own CSS. Nothing in `@rockaway/css` transitions or eases, and a test now fails the build if anything starts to.

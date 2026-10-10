---
id: 113
uid: b3d91ec7-4af8-4303-87a9-219129522ee2
title: Measure the paint budget, and decide whether a canvas painter is needed
type: spike
status: done
milestone: site
assignee: Oddur Sigurdsson
depends_on:
- 104
- 111
- 117
created: 2026-09-23
updated: 2026-10-03
closed_at: 2026-10-03
priority: p1
layer: grid
effort: m
---

## Question

At what screen size do the DOM painters stop holding a frame budget, and is a
canvas painter the answer or is coalescing enough?

## Time box

One day, once a real page exists to measure — the dog-food site, not a story.

## Why it matters

The glyph painter coalesces same-style runs into spans. The rule painter does
not: it emits one positioned `div` per cell with edges, plus one per stroke, so
a full-page frame at 120x40 is thousands of nodes. Nobody has measured it.

## Findings

Measured on 2026-10-04 in headless Chromium (Playwright 1.63) on an Apple-silicon Mac, unthrottled and at 4× CPU throttle (CDP `Emulation.setCPUThrottlingRate`). Each figure is the median of 5–6 repeats.

**The premise has moved.** Since 0117 the two painters are one renderer. Both write the same coalesced runs, and the rule painter only sets other stroke variables. So node counts are identical, and every timing below matched between them within noise. "Coalescing" is already done. What's left is the cost of the cells that draw their own shape, which can't coalesce across a junction.

**Method.** A frame is timed from the change to the second `requestAnimationFrame` after it. That second frame runs once the frame containing the change has been produced, so 2 frames (about 33ms) is the floor. Script, style and layout times come from CDP `Performance.getMetrics` deltas. Two pages:

1. **The real page:** the site shell (0104, `feat/site-shell` at 00d63f9, built static with its runtime), on `/concept/`, with the window sized to 80×24, 120×40 and 200×60 cells (9.6×24px at normal density).
   - **First paint:** load until the shell reveals itself (`data-rk-shell`) plus a frame.
   - **Resize:** the window a cell narrower and back, until the screens report their new size, plus a frame.
   - **Density switch:** each density in turn.
   - **Scroll:** two seconds of wheel on the page pane, counting frames.
2. **The worst case:** a screen where almost every cell is a line or a junction (rules every 2 rows and 3 columns), painted by `paintCells` and repainted at the new size on resize and density. I also measured a frame of text the same size, which is what most screens are. Scroll is six such screens stacked in the page.

**The real page is far inside the budget, at every size and both throttles:**

| shell | nodes | runs | shaped cells | first paint (1× / 4×) | resize | density | scroll (4×) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 80×24 | 1,034 | 124 | 153 | 173 / 592ms | 83ms | 33ms | 59fps |
| 120×40 | 1,209 | 283 | 242 | 174 / 591ms | 83ms | 33–50ms | 58fps |
| 200×60 | 1,369 | 423 | 322 | 170 / 607ms | 83–99ms | 32–51ms | 58fps |

- **First paint** is flat across sizes. It is the island's script loading and measuring, not painting: 4× throttle multiplies it by 3.5 whatever the size.
- **Resize** includes the window change itself, about 80ms of harness overhead, which is flat across sizes.
- **Scroll** worst frame was 33ms at 4×, with 0–3 frames over 33ms in two seconds.

**A screen of text** is the same at any size: 107–251 nodes, every repaint at the 2-frame floor, style and layout under 6ms even at 4×.

**The worst case** shows where the DOM painters stop holding a frame:

| lattice | nodes | shaped cells | layers | resize 1× / 4× | density 1× / 4× | scroll 4× (worst frame) |
| --- | --- | --- | --- | --- | --- | --- |
| 80×24 | 1,330 | 1,010 | 2,020 | 32 / 47ms | 32 / 59ms | 60fps (17ms) |
| 120×40 | 3,290 | 2,480 | 4,939 | 32 / 100ms | 39 / 149ms | 58fps (50ms) |
| 200×60 | 8,110 | 6,126 | 12,252 | 60 / 247ms | 88 / 386ms | 44fps (133ms) |

- **Style recalculation dominates.** At 4×: 65ms for a resize at 200×60 and 190ms for a density switch. That's about 30µs per shaped cell, then layout at about a third of that. Script stayed below what CDP reports.
- **Hoisting the per-cell custom properties** (the ink shades, dot and radius definitions on every `[data-rk-shape]`) out of the generic rule changed nothing measurable: 386ms became 376ms. The cost is per element, not per property.
- **Where it breaks:** unthrottled, even 6,000 shaped cells repaint in 3–5 frames and scroll at 60fps. At 4× throttle, a repaint misses a frame past about 1,000 shaped cells, takes 100–150ms at about 2,500, and scrolling drops below 60fps around 6,000.
- **Real screens** are at most a few hundred shaped cells: the shell, frames, tables with column rules, trees. A lattice is not a real screen.

**Not measured, inside the time box:** Firefox and WebKit, a GPU-rastered headed browser, a real low-end device, and the paint and raster phase on its own. The frame timings include it, but CDP's metrics don't break it out.

## Recommendation

**No canvas painter.** The DOM painters hold the budget on every real page by a wide margin, and fail only on a pathological lattice under heavy throttle. Even there it's a discrete cost (a resize, a density switch), not an animation.

A canvas painter would trade away things this system is built on:
- the characters as text: copy, paste, find in page, `screenshot()`, `readScreen`;
- forced colours, which reach into the cells through system colours;
- print;
- the server-rendered first paint (0126);
- zoom crispness without DPR bookkeeping;
- the pixel continuity check, which reads elements.

The CTO's prior holds. One correction: coalescing is already done, so the lever left is shaped-element count. If a component ever approaches a thousand shaped cells per screen, do these first:
1. Keep straight runs as single elements, which they already are. Only junctions and corners need their own cell.
2. Repaint only rows whose buffer changed, instead of the whole screen.
3. On a density switch, let the stylesheet move the existing cells rather than replacing them.

**Proposed follow-ups (not filed):**
- **A budget check:** a story check, or a `checkPaintBudget` beside `checkContinuity`, that warns when one screen has more than 1,000 shaped cells. Any component that crosses it shows up in review, before it reaches a reader on a slow device.
- **Repeat these figures** in Firefox and WebKit once the engines job (#162) lands, and on one real low-end Android device.

## 2026-10-03

Moved to the site milestone by the program plan: the time box says it waits for a real page, and the dog-food site is that page. Depends on 0117, which changes what the rule painter costs.

## 2026-10-03

From 0117: vertical lines and junctions are one element each with up to eight background layers, and nobody has measured that on a full-page frame. Measure the shaped cells here, not only the node count.

## Result

No canvas painter: the site shell holds the frame budget at 80x24 to 200x60 even at 4x CPU throttle (at most 1.4k nodes, 322 shaped cells, 58-60fps scroll); the DOM painters only miss frames past about 1,000 shaped cells per screen under throttle, which no real screen reaches. Canvas would cost copy, find, forced colours, print and the server first paint. If a component nears 1,000 shaped cells, cut shaped elements (row-level repaint, no repaint on density) before considering canvas.

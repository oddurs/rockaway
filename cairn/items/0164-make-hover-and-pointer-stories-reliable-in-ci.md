---
id: 164
uid: 1371d77c-ab10-489b-9913-16a3faa8cbe5
title: Make hover and pointer stories reliable in CI
type: chore
status: review
milestone: primitives
assignee: Oddur Sigurdsson
claimed: 2026-10-03
created: 2026-10-03
updated: 2026-10-03
priority: p1
layer: tooling
effort: s
---

## Problem

A synthetic hover ended at once on Linux CI Chromium while passing locally, most
likely because the screen re-measures after the font loads and the browser
sends real boundary events. Link worked around it; every component with a
hover story will meet it.

## Acceptance criteria

- [x] A shared helper in the workbench waits for fonts and two frames before a story measures or points, or hover is driven by the real pointer through `vitest/browser`
- [x] Every existing hover story uses it, and a CI run repeated five times passes every time
- [ ] The recipe (0134) says to use it

## 2026-10-03

Cause, confirmed: React Aria's useHover adds a document-level pointerover listener while hovering, and ends the hover on any pointerover outside the hovered element. When the layout shifts under Chromium's real pointer (the font arriving, then Screen re-measuring), Chromium sends real boundary events at the real cursor, which is not where userEvent.hover dispatched its synthetic events. So the hover ends at once. It shows only on a cold font cache, which is why a full CI run rarely hits it: whichever story file runs first pays for the font.

## 2026-10-03

Proof, on Linux CI Chromium with Link and Button stories run alone, a fresh browser each time. With no wait: 2 of 10 runs failed, Hovered both times, with the same assertion #68's first CI run hit (run 37137471213). With settled(): 0 of 20 failed (run 37137744291). Five full CI runs with no wait at all were green, which is why the experiment had to isolate the cold cache. The experiment step was removed before merge.

## 2026-10-03

settled() lives in apps/workbench/src/settled.ts. It awaits document.fonts.load() for the root's computed font, then document.fonts.ready, then two animation frames. fonts.ready alone resolves at once when no load has started yet, and Link's local copy relied on it. Used by Link (every story with a play function that points or measures, the forced-colors one included) and Button Pressed, which are all the pointer stories. CONTRIBUTING says to use it. The recipe (0134) does not exist yet, so criterion 3 waits for it; 0134 carries a note saying it must.

## 2026-10-03

After merging main: List's stories from #87 had their own copy of the weaker wait, fonts.ready plus two frames, and now import the shared settled() too. Its hover and click stories (Hovered, Densities, CursorAndSelection, AsText, ForcedColors) are covered by it.

## 2026-10-03

Five full CI runs on 18dbc2d, the final head with the experiment removed, all green: run 37148040833, attempts 1 to 5.

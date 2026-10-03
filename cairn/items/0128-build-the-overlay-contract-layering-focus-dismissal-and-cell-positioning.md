---
id: 128
uid: fb73ba36-7208-484d-a759-adcdb2ed445f
title: 'Build the overlay contract: layering, focus, dismissal and cell positioning'
type: feature
status: backlog
milestone: primitives
depends_on:
- 96
- 117
- 118
- 126
created: 2026-10-03
updated: 2026-10-03
priority: p0
layer: components
effort: l
---

## Problem

Popover, Dialog, Menu, Select, Tooltip, Combobox and CommandPalette (0034,
0039, 0041–0043, 0055, 0102) all float above a screen. React Aria supplies
focus containment, dismissal and a position in pixels. On the grid there are
four more problems no item owns:

1. **Position in whole cells.** React Aria's position is pixels. An overlay
   must land on the cell grid of the screen it belongs to, or it fails
   conformance the moment it opens.
2. **Context through a portal.** Overlays portal to the end of `body`, which
   drops any `data-density` or `data-theme` set on a subtree. A popover opened
   from a touch-density pane would render dense.
3. **Elevation without shadows.** 0075 retired shadows: "overlays separate by
   border weight and a `░` backdrop". Nobody has drawn the backdrop.
4. **Snapshots.** An overlay is a separate screen, so a text snapshot of a
   page with a dialog open shows the page without it.

## Proposal

`packages/react/src/overlay/`:

- **OverlayLayer**: one portal root per app, inside the root that carries the
  theme, so overlays inherit mode and theme; the overlay copies the trigger's
  nearest `data-density` and `data-rk-theme` onto its own host.
- **useCellPosition**: wraps React Aria's positioning and quantises the result
  to whole cells relative to the anchor's screen (or the root grid when the
  anchor is not in one). Flips and shifts in cells; `maxHeight` in rows.
- **Each overlay is a `Screen`**, framed by Frame, so it measures, conforms
  and paints like everything else. Non-modal overlays draw `heavy`; modal ones
  draw `double`; both are glyph tokens a theme can change.
- **Backdrop**: a modal fills the viewport with `░` in `fg.muted`, drawn by the
  cell renderer (0117), `aria-hidden`. Pressing it dismisses when the modal is
  dismissable.
- **Dismissal**: Escape always; outside press for non-modal and dismissable
  modals; focus returns to the trigger. Modals contain focus and lock scroll,
  through React Aria.
- **No motion**: an overlay appears on the next frame, fully drawn.
- **Touch**: under 60 cells, or at touch density, a dialog is a full-width
  sheet anchored to the bottom, and a popover is full-width below its trigger.
- **screenshot() composes open overlays** over the screen beneath, so a text
  snapshot of a page with a dialog shows the backdrop and the dialog.

## Acceptance criteria

- [ ] An open popover and an open dialog pass conformance, at all four densities, with their position checked as well as their size
- [ ] A popover opened from a pane at touch density renders at touch density, in a story
- [ ] Placement flips in whole cells when the overlay would leave the viewport, asserted at 40 cells wide
- [ ] The backdrop is drawn in cells, is `aria-hidden`, survives forced colors, and dismisses only when allowed
- [ ] Escape and outside press dismiss per the proposal, and focus returns to the trigger, in a keyboard story
- [ ] `screenshot()` of a screen with an open dialog shows the backdrop and the dialog, as a checked-in snapshot
- [ ] Nested overlays (a menu in a dialog) stack, dismiss innermost first, and restore focus correctly
- [ ] `docs/concept.md` gains an "Overlays" section stating the contract

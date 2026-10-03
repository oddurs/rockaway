---
id: 128
uid: fb73ba36-7208-484d-a759-adcdb2ed445f
title: 'Build the overlay contract: layering, focus, dismissal and cell positioning'
type: feature
status: review
milestone: primitives
assignee: Oddur Sigurdsson
claimed: 2026-10-03
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

- [x] An open popover and an open dialog pass conformance, at all four densities, with their position checked as well as their size
- [x] A popover opened from a pane at touch density renders at touch density, in a story
- [x] Placement flips in whole cells when the overlay would leave the viewport, asserted at 40 cells wide
- [x] The backdrop is drawn in cells, is `aria-hidden`, survives forced colors, and dismisses only when allowed
- [x] Escape and outside press dismiss per the proposal, and focus returns to the trigger, in a keyboard story
- [x] `screenshot()` of a screen with an open dialog shows the backdrop and the dialog, as a checked-in snapshot
- [x] Nested overlays (a menu in a dialog) stack, dismiss innermost first, and restore focus correctly
- [x] `docs/concept.md` gains an "Overlays" section stating the contract

## 2026-10-03

Built on React Aria, not beside it: OverlayPopover is Popover and OverlayModal is ModalOverlay+Modal, each with a Surface that is a Screen of its own. React Aria keeps placement, flip, focus containment and return, scroll lock and dismissal; the contract translates its pixel position onto the cell grid of the trigger's nearest .rk-screen (round, re-snapped on the wrapper's style mutating, resize and scroll), with offset 0 and containerPadding 0 so a popover sits on the next row with no gap.

## 2026-10-03

Contexts cross the portal by copying the trigger's nearest data-rk-theme, data-theme, data-density, data-motion and data-rk-conformance onto the overlay; OverlayLayer is the portal root, mounted in the workbench decorator so every afterEach check sees open overlays. A modal's anchor is PopoverContext.triggerRef, which DialogTrigger provides even for modals; document.activeElement was body by then.

## 2026-10-03

Elevation by weight (0075): popover heavy, modal double, ASCII bold (0183). Backdrop is a Screen of block.light in fg.muted on bg.page, aria-hidden; under forced colors the cell renderer keeps it (forcedColorAdjust none on the run). Under 60 cells or at touch density a modal is a sheet floored to the viewport's whole cells, bottom-start, and a popover is viewport-wide. Scrolling content uses rk-scroll and the frame's right edge carries the thumb (0207).

## 2026-10-03

screenshot() composes .rk-overlay-layer children over the screen (overlays: false to opt out); checkContinuity hides the overlay layer while reading a page's layers, and hides everything else in the layer while reading an overlay's own, so a dialog is not a break in the frame beneath it.

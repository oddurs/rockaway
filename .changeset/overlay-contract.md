---
'@rockaway/react': minor
'@rockaway/css': minor
---

Add the overlay contract: `OverlayLayer`, `OverlayPopover` and `OverlayModal`, what Popover, Dialog, Menu, Select, Tooltip, Combobox and CommandPalette build on. Put one `OverlayLayer` around the app, inside whatever carries its theme; overlays open into it and copy their trigger's theme, mode, density, motion and conformance across the portal. `OverlayPopover` is React Aria's `Popover` with its surface moved onto the cell grid of its trigger's screen, on the next row and framed heavy; `OverlayModal` is React Aria's `ModalOverlay` and `Modal`, the dialog framed double and centred on the grid over a backdrop of the theme's light shade. Content taller than `maxRows`, or than the room there is, scrolls with no native scrollbar and shows its position in the frame's right edge. Under 60 cells, or at touch density, a modal is a sheet on the bottom rows and a popover is as wide as the viewport. `overlayBuffer` and `backdropBuffer` draw the frame and the backdrop as text.

`screenshot()` now draws the overlays open above a screen over it, so a text snapshot of a page with a dialog open shows the backdrop and the dialog; pass `overlays: false` for the screen alone. `checkContinuity` reads each painted layer with the overlay layer hidden, and an overlay's own layer with everything else in the layer hidden, so a dialog does not count as a break in the frame beneath it.

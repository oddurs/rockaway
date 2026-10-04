---
'@rockaway/react': minor
'@rockaway/css': minor
---

Add `Dialog` and `AlertDialog`, built on the overlay contract. A dialog is React Aria's `Dialog` in an `OverlayModal`: the backdrop of shade drawn in cells, the dialog framed double and centred on whole cells, its `title` set into the top edge and naming it, its content, and an `actions` row of buttons at the bottom right. Content and actions may be functions of `close`. Under 60 cells, or at touch density, it is a full-width sheet on the bottom rows. React Aria contains focus, puts it on the dialog when it opens, returns it to the trigger, and closes on Escape; a press on the backdrop closes it only when `isDismissable`. `AlertDialog` is the destructive confirmation: `role="alertdialog"`, the theme's caution mark before its title, a destructive action and a safe one, the safe one the primary and focused first, and no closing from the backdrop. `dialogBuffer` and `dialogHeading` draw the frame and its heading as text. `OverlayPopover` and `OverlayModal` take a `title` for the frame's top edge.

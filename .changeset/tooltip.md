---
'@rockaway/react': minor
'@rockaway/css': minor
---

Add `Tooltip`, a one-line hint on hover or keyboard focus, and `OverlayTooltip`, the overlay contract's tooltip it is built on. Put a `Tooltip` in React Aria's `TooltipTrigger`. It sits on whole cells of its trigger's screen, on the row next to the trigger with no gap. When its words fit on one row it is that row in reverse video; when they wrap, at 36 cells, it is framed heavy as a popover is; either way it is at most 40 cells wide, and never a sheet. React Aria shows it at once on keyboard focus and after a delay on hover, never on touch, links it by `aria-describedby`, hides it on Escape and never moves focus. `tooltipBuffer` draws its chrome as text; the overlay contract's `OverlayKind` gains `tooltip`.

---
'@rockaway/react': minor
'@rockaway/css': minor
---

Add `Menu`, `MenuItem`, `MenuSection` and `MenuSeparator`: a list of actions opened from a trigger, in a Popover. Put a `Menu` in a React Aria `MenuTrigger` after its button, or in a `SubmenuTrigger` after the item that opens it. Its rows are drawn as List's are: the cursor's mark in a cell every row reserves, and the cursor's row in reverse video from one side of the frame to the other. A menu with checkable items reserves a second cell for the check in every row, so the labels line up. A separator, and a section's `title`, are rules across the popover's frame that join its sides as tees. `keys` on an item draws its shortcut right-aligned as a KeyHint and announces it as `aria-keyshortcuts`. A submenu opens beside its menu's frame, with its first item on the row of the item that opened it, and flips to the other side in whole cells when there is no room. `menuBuffer` draws a menu as text. React Aria's `MenuTrigger` and `SubmenuTrigger` are re-exported beside Menu, so code that imports only `@rockaway/*` can open one.

A submenu opened from an `OverlayPopover` now mounts inside its root popover, as React Aria intends, so focus moves into it rather than back to the page.

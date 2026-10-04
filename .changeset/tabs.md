---
'@rockaway/react': minor
'@rockaway/css': minor
---

Add `Tabs`, `TabList`, `Tab` and `TabPanel`, on React Aria's. The tab list is drawn into the top edge of the panel's frame, so tabs and panel are one box, with a cell of line between two tabs. The selected tab is reverse video and bold, and stays reversed in forced colors. Tabs that do not fit the edge scroll by whole tabs, with the theme's overflow marks at the ends, and the focused tab is always shown, or the selected one when focus is elsewhere, so under manual activation the arrows never move focus to a tab out of sight. A tab whose label is text is placed from the first render, so tabs rendered on a server show in their gaps with no script. Give each `Tab` an `id`; its `TabPanel` takes the same one. `layoutTabs`, `tabsBuffer` and `tabsText` draw the same thing with no DOM. `@rockaway/css` ships `tabs.css`.

`Screen` now also takes a function as its children, which it calls with the size it drew at, in cells.

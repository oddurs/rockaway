---
'@rockaway/react': minor
'@rockaway/css': minor
---

Add `Tabs`, `TabList`, `Tab` and `TabPanel`, on React Aria's. The tab list is drawn into the top edge of the panel's frame, so tabs and panel are one box, with a cell of line between two tabs. The selected tab is reverse video and bold, and stays reversed in forced colors. Tabs that do not fit the edge scroll by whole tabs, with the theme's overflow marks at the ends, and the selected tab is always shown. Give each `Tab` an `id`; its `TabPanel` takes the same one. `layoutTabs`, `tabsBuffer` and `tabsText` draw the same thing with no DOM. `@rockaway/css` ships `tabs.css`.

`Screen` now also takes a function as its children, which it calls with the size it drew at, in cells.

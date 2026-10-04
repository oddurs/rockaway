---
'@rockaway/react': minor
---

Add `Popover`, a framed box anchored to its trigger for content that belongs to it: a filter, a picker, help for a field. Use it inside a React Aria `DialogTrigger`, or as the box a Select, Menu or Combobox opens. It is the overlay contract's popover: on the row next to its trigger, starting in its column with no gap, framed heavy, flipping to the other side in whole cells when there is no room, and never covering the trigger. By default it is never narrower than its trigger, in whole cells, so a Select's list lines up with the Select; `minCols` takes a count of cells instead, and `minCols={0}` lets it be as narrow as its content. `maxRows` caps its height, and past it the content scrolls with the thumb in the frame's right edge. React Aria's props in pixels (`crossOffset`, `containerPadding`, `maxHeight`) are not offered. `popoverBuffer` draws a popover and its trigger as text.

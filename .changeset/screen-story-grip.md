---
---

No package changes. Grid/Screen's container stories hosted the screen in a box with `resize: horizontal`, and an engine that draws the native resize grip (WebKit on macOS, Firefox on Linux) drew it over the box's corner, which is the screen's last cell. The continuity check read the grip laid over `┘` and its neighbour as a broken line. The stories set the host's width themselves, so the host no longer asks for a grip. The renderer was never at fault.

---
'@rockaway/react': minor
---

Adds `useCellsWide(ref, initial)`: how many whole cells wide an element is, kept current as it resizes. It counts the way `Screen` does, and measures after mount so the server and the first client render agree on `initial`. It replaces the ResizeObserver beside `measureCell` that apps wrote by hand.

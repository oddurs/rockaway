---
---

The TextField Overflow story now allows for engine differences. A scroll position may be within a device pixel of a cell, as WebKit keeps it, and the story waits for the overflow marks rather than reading them at a fixed frame. Workbench only; nothing published changes.

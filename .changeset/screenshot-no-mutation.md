---
'@rockaway/react': patch
---

`screenshot()` and `checkConformance()` from `@rockaway/react/testing` no longer change the document while they read a measured screen. They read the cell from the pixels `Screen` wrote, and lay a probe out only before it has measured. Inside `waitFor`, which runs its callback again on every change to the document, a probe added and removed made a failing check run itself again in a microtask, for ever, so the test hung instead of failing.

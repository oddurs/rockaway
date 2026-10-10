---
"@rockaway/react": patch
---

A submenu that flips to the left of its menu stays beside it. The popover re-placing added in 0246 no longer runs for a trigger inside another overlay. That trigger moves only when its own surface snaps, and placed again there, React Aria measured from the document and put the submenu off the page.

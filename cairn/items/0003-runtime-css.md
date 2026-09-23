---
id: 3
key: runtime
title: Runtime CSS
type: milestone
status: done
depends_on:
- 2
created: 2026-09-22
updated: 2026-09-22
priority: p2
due: 2026-11-15
---

The CSS contract every consumer shares.

Layer order, reset and base type, focus and motion, forced-colors, and the
Tailwind adapter for app teams. After this the platform is doing the work that
a styling library used to.

## 2026-09-22

Done 2026-09-23, ahead of the 2026-11-15 due date. The layer order is fixed and proven; reset and base read semantic tokens only; one focus ring; reduced motion from the system or an in-app setting; forced colors handled at the token level and verified in a browser genuinely running in that mode; tokens registered with @property; a named container convention; and a generated Tailwind adapter tested by compiling real utilities.

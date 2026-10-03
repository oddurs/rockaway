---
'@rockaway/tokens': minor
'@rockaway/css': patch
'@rockaway/react': patch
---

The default density meets WCAG 2.2 AA, and touch is 44px (decision 0197). The line boxes are now `dense` 1, `normal` 1.5, `airy` 2 and `touch` 2.75. At 16px that makes a one-row control 16, 24, 32 and 44px tall. `normal` was 1.25 (20px) and `touch` 2 (32px).

`dense` stays at 1. It is the opt-in for a terminal's tightness, and adjacent one-row targets there do not meet WCAG 2.5.8. A coarse pointer with no density chosen now gets 2.75 instead of 2. The server-side guess for the cell (`DEFAULT_CELL`) is 24px tall, to match the new default.

`@rockaway/react/testing`: `checkTargets` no longer counts a visually hidden input — one inside a clipped wrapper, as React Aria's checkbox and radio render it — as a target of its own.

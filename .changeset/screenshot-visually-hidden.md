---
'@rockaway/react': patch
---

`screenshot()` from `@rockaway/react/testing` no longer reads back what is visually hidden. An element clipped to nothing (`clip-path: inset(50%)`, or `clip: rect(0 0 0 0)`) is still in the DOM and seen by no one, so neither its words, nor anything inside it, nor its attributes in the legend are written. That covers a skip link at rest and React Aria's `VisuallyHidden`. `checkTargets` reads the pattern through the same rule.

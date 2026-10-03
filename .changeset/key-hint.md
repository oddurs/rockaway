---
'@rockaway/react': minor
'@rockaway/css': minor
---

Add `KeyHint`, `⌘S save`: one chord spec gives what you see (`⌘S`, `Ctrl+S`, or `^S` in terminal notation), what a reader hears ("Command S") and what the platform is told (`Meta+s`). `formatKeys`, `spokenKeys`, `keyShortcut` and `parseKeys` are the pure parts. `Button` takes a `keys` prop that draws the hint beside the label and sets `aria-keyshortcuts` itself, since React Aria does not forward it. Grid conformance now measures an inline box across but not down, and skips visually hidden text, which has no geometry anyone can see.

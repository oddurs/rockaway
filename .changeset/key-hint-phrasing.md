---
'@rockaway/react': patch
---

KeyHint and a Link that opens a new tab can now sit inside a `<p>`. Their words for a screen reader were in React Aria's `VisuallyHidden`, which renders a `div`. A browser ends a paragraph at a `div`, so the server's markup no longer matched what React hydrated, and hydration failed. They now render a `span`, as Table's hidden cell text does.

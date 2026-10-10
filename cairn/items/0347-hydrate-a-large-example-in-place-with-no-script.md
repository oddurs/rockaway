---
id: 347
uid: 9f428602-3177-43ea-94ee-255f21abe7e1
title: Hydrate a large example in place with no script
type: bug
status: backlog
milestone: site
created: 2026-10-10
updated: 2026-10-10
priority: p1
layer: site
---

React outlines Suspense boundaries over 12.8 kB, so with JS off the site's large examples sit at the end of the document. The fix is an island render that waits for React Aria's collections, on Next's vendored React. What was tried and why it failed is in team/handoffs/site.md.

## Acceptance criteria

- [ ] With no script, every example renders in place in the page
- [ ] CLS stays 0 at all four widths

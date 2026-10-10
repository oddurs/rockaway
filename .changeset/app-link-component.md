---
'@rockaway/react': minor
---

Add `LinkComponentProvider`: wrap an app in it with the framework's own link (`next/link`, a router's `Link`) and every `Link` renders through it, so the framework prefetches the page and follows it itself. With no provider, and on a server with no script, a `Link` is still a real `a href`. A disabled link is never given to the framework. Use it or a `RouterProvider` to navigate, not both.

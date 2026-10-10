---
'@rockaway/react': minor
---

Add `createRouteChanges`, for an app that changes routes without reloading the page. On each route it starts every scroll pane at the top (or at the hash), or returns it to where it was when the reader went back, focuses the new page's heading, and announces its title on a status line the app owns. It takes elements and a function, so it works with any router.

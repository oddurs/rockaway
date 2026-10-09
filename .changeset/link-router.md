---
'@rockaway/react': minor
---

Re-export React Aria's `RouterProvider` from `@rockaway/react` (and `@rockaway/react/link`), so client-side routing is one import: wrap the app in `<RouterProvider navigate={navigate} useHref={useHref}>` with your router's own, and every `Link` navigates through it. It is the same instance `Link` reads, which an app importing `react-aria-components` itself cannot promise: a second copy, or none under pnpm's strict installs, would give a router no `Link` can see.

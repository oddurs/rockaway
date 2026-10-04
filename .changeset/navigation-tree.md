---
'@rockaway/react': minor
'@rockaway/css': minor
---

Add `NavigationTree` and `NavigationTreeItem` to Tree: the same rows, for a site's navigation. Each row's label is a real link to its `href`, so it opens in a new tab, copies as a link and works before any script has run. The page you are on, `current`, is drawn as a selected row and is `aria-current="page"`; under forced colours it stays out of the backplate as a selected row does.

---
'@rockaway/react': minor
'@rockaway/css': minor
---

Add LinkTree: a tree of links for a site's map or a page's outline. It has Tree's rows, guides and reverse video, rendered as a nested list of real links rather than a widget. It works on a server with no script, and Tab, a screen reader and a new tab do what they always do with links. The page you are on is reverse video and `aria-current`; the row whose link has keyboard focus shows the theme's cursor mark, drawn by the stylesheet. `linkTreeBuffer` draws it as text, with Tree's own `treeBuffer`.

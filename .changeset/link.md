---
'@rockaway/react': minor
'@rockaway/css': minor
---

Add `Link`, text that is always underlined, so it reads as a link without its colour. Hover doubles the underline, pressed is reverse video, disabled dims, and `aria-current` is bold with the theme's cursor mark in the cell before the link, which the layout leaves blank, so nothing moves when a link becomes current. A link that opens a new tab carries a mark for the eye and "(opens in a new tab)" for the ear, with the words set by `newTabLabel`. Behaviour and navigation are React Aria's, including a `RouterProvider`. `linkBuffer` draws any state as text.

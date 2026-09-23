---
'@rockaway/react': minor
---

Add the DOM painters at `@rockaway/react/paint`: `paintGlyph` writes box-drawing characters, `paintRule` draws the same geometry as CSS hairlines. Both paint chrome into an `aria-hidden` layer and are plain DOM, with no React in them.

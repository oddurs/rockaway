---
'@rockaway/tokens': major
'@rockaway/css': major
'@rockaway/react': patch
---

Retire the tokens a character grid cannot express: `radius.*`, `shadow.*` and the type scale (`font.size.*`, `text.*`). Corners are glyphs, a surface is its border, and there is one type size, so emphasis is weight, case or reverse. The `radius` and `elevation` theme inputs go with them. Colour roles keep every one of their names.

---
'@rockaway/tokens': minor
'@rockaway/css': minor
'@rockaway/react': patch
---

Breaking: the tokens a character grid cannot express are retired: `radius.*`, `shadow.*` and the type scale (`font.size.*`, `text.*`). Corners are glyphs, a surface is its border, and there is one type size, so emphasis is weight, case or reverse. The `radius` and `elevation` theme inputs go with them. Colour roles keep every one of their names.

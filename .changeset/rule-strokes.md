---
'@rockaway/react': patch
---

Fix the rule painter: an edge is a stroke from the centre of its cell toward that side, not a border on the cell's box, so neighbouring cells join into one continuous line and corners meet where the glyphs put them.

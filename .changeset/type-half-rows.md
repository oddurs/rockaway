---
"@rockaway/react": minor
"@rockaway/css": minor
---

Size type in half rows (0323): `Text` takes `size={1.5}` and `size={2.5}`, with glyphs a row and a half or two and a half tall, padded up to whole rows. An inline run is padded above its glyphs, so its line stays whole rows. A block is a seam, so its box closes to whole rows however many lines it wraps to. `textRows` gives the rows a size takes, and `halfTextSizes` lists them.

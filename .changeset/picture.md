---
"@rockaway/react": minor
"@rockaway/css": minor
---

Add `Picture` (0320): a real image in a box of whole cells. It is `cols` cells across, or every whole cell its container gives it, and as many whole rows as the image's ratio makes of that width, cropped to fill them. A caption goes on the rows under it. The stylesheet works the rows out in `round()` against the cell, so there is no script, nothing moves when the image arrives, and a server renders it as it is. `pictureRows` does the same sum, and `pictureBuffer` draws one as text.

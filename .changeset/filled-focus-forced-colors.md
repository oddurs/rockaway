---
'@rockaway/css': patch
---

A focused filled control (`data-rk-fill`) and a selected Tree row now show their reverse video in forced colors, the tree's guides included. Their words used to vanish into the backplate the browser paints behind text. A test now finds every rule that draws words in a ground colour and fails if nothing opts it out of the forced-colors adjustment, so the next reversal cannot be missed.

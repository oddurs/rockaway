---
'@rockaway/css': patch
---

A focused filled control (`data-rk-fill`) now shows its reverse video in forced colors. Its words used to vanish into the backplate the browser paints behind text. A test now finds every rule that draws words in a ground colour and fails if nothing opts it out of the forced-colors adjustment, so the next reversal cannot be missed.

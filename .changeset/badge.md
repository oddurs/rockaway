---
'@rockaway/react': minor
'@rockaway/css': minor
---

Add `Badge`, a short status label: words in the tone's colour on the tone's subtle ground, one row tall. The `tone` variant is `neutral`, `accent`, `success`, `warning` or `danger`, and every tone but neutral draws the theme's mark before its words (`● 3 new`, `✓ passing`, `! degraded`, `✗ failing`), so no tone relies on colour alone. Neutral, or any tone with `mark={false}`, is delimited instead (`[beta]`), and both forms are two cells wider than the words. The marks and delimiters are hidden from readers. `badgeBuffer` draws any tone as text.

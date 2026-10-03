---
'@rockaway/react': minor
---

Add `checkField`, `expectField` and `formatFields` to `@rockaway/react/testing`: the field contract, read back off a rendered page. For every field under a root it reports a required mark drawn when the field is not required, or missing when it is (the one thing a field author has to pass by hand), a mark that is not `aria-hidden`, a description or an error that is in no control's `aria-describedby`, a glyph in an accessible name, and a live region, which would announce an error a second time.

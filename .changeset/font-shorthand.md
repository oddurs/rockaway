---
'@rockaway/tokens': minor
'@rockaway/css': patch
---

Make the shipped CSS survive minification: drop the `font` shorthand (Lightning CSS will not parse one whose value is a `var()`), and repair the `@property` registrations Terrazzo gave a `var()` initial value. Text styles are used as their parts, and `vars` lists them that way.

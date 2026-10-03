---
'@rockaway/tokens': minor
'@rockaway/css': minor
---

Highlight code in the ANSI 16 (cairn 0144).

- `@rockaway/tokens`: a `syntax.*` group with one role per kind of token (`plain`, `comment`, `keyword`, `string`, `constant`, `function`, `type`, `attribute`, `regexp`, `inserted`, `deleted`, `error`). Each is a palette slot, so code follows the theme and the mode. `syntaxRoles` lists them. The contrast gate holds every role on `bg.surface` and `bg.subtle` in both modes.
- `@rockaway/css`: `syntax.css` colours `.rk-syntax-<role>` from those tokens. A comment is also italic and an error underlined, so code reads in greyscale.

---
'@rockaway/css': patch
'@rockaway/react': patch
---

A disabled `fill` Button no longer draws as an enabled one. It stays reversed and dims its block: fg.disabled behind the words in bg.page, a lighter block than an enabled fill's in greyscale and GrayText in forced colors, where it opts out of the backplate as an enabled fill does. It takes the same cells either way. Button's metadata says so on its disabled state.

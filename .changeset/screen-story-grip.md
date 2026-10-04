---
'@rockaway/react': patch
---

Say in Frame's metadata, and on `Screen`, that a screen filling a box with CSS `resize` shares its last cell with the browser's resize grip, which some engines draw over the corner. Grid/Screen's own stories had exactly that, and read it as a broken corner in WebKit on macOS and Firefox on Linux; their host no longer asks for a grip.

---
'@rockaway/react': patch
---

A `Button` with `keys` now renders `aria-keyshortcuts` on its button element on the server, so a page that is never hydrated still announces the chord. Button used to set the attribute in an effect after the first render, because React Aria filters it out of the props it forwards; it now draws the element through React Aria's `render` prop with the attribute on it. The server's value is for the neutral keyboard, as the drawn hint is, and the reader's keyboard follows once the page hydrates.

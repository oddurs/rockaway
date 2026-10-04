---
'@rockaway/react': patch
---

`Button` now passes a `ref` you give it to the button element, an object or a callback, alongside the one it keeps for itself. It used to set its own after spreading your props, so your ref never received the element: an app could not focus a Button, and a Keymap binding could not press one.

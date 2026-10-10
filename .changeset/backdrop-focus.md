---
'@rockaway/react': patch
---

Keep focus in a modal when its backdrop is pressed. Firefox put focus on the page's body after a press on the backdrop of a modal that is not dismissable, and from there Escape never reached the modal, so it could not be closed from the keyboard; the press now takes no focus in any engine.

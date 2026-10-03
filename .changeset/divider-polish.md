---
'@rockaway/react': patch
---

A label on an open `Divider` keeps a whole cell of line between it and the rule's half-stroke end: `╶─ files ──╴`, where it was `╶ files ───╴` and the half cell sat stranded beside the label. A joined rule is unchanged. The label is drawn in `fg.default` explicitly, so it keeps the text colour in ANSI output as well as on a page. A rule drawn in the `ascii` set now ends a truncated label in ASCII (`~`) whatever the theme.

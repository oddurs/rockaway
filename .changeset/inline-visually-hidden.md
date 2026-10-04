---
'@rockaway/react': patch
---

KeyHint's spoken keys and Link's "opens in a new tab" are spans, not divs. Both sit in sentences; a div inside a paragraph closes the paragraph when the page is parsed, so a server-rendered hint or link in prose became a different tree from the one React hydrated (React error 418) and, with no script, a broken one.

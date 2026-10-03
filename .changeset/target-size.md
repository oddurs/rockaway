---
'@rockaway/react': minor
---

Add `checkTargets`, `expectTargets` and `formatTargets` to `@rockaway/react/testing`: every visible target under an element measured against WCAG 2.5.8, at least 24 by 24 CSS pixels or with room for a 24px circle around it, with a link inside a sentence exempt as WCAG exempts it. `minHeight` also asks every target to be at least that tall, which is how the workbench holds a one-row control to 44px at touch density.

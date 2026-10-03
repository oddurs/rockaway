---
'@rockaway/react': minor
---

Add `defineVariants`, which declares a component's variants as typed data: the prop types are inferred from it, `select` fills in the defaults, and `dataAttributes` writes one `data-*` attribute per variant, defaults included. Button is built on it, and its rendered markup is unchanged. A value a JavaScript caller passes that was never declared now draws as the default rather than reaching the CSS.

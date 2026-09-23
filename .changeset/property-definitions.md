---
'@rockaway/tokens': minor
---

Register tokens with `@property`. Reference tokens get a typed syntax and an initial value, so an invalid value is rejected instead of breaking every rule that reads it; aliases stay untyped so environment overrides still apply. Computed values are now canonical (`0.2s` rather than `200ms`).

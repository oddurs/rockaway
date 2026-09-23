---
id: 61
title: 'Specify the focus ring: 2px gap, 2px accent'
type: decision
status: done
milestone: runtime
assignee: Oddur Sigurdsson
created: 2026-09-22
updated: 2026-09-22
priority: p1
layer: css
effort: s
---

## Decision

Decided 2026-09-22. One focus treatment, defined once in the base layer:

```css
:focus-visible {
  outline: var(--rk-focus-width) solid var(--rk-border-focus);
  outline-offset: var(--rk-focus-offset);
}
```

`outline` rather than a two-layer `box-shadow`, as the concept canvas drew it:
it follows `border-radius`, it cannot be clipped by `overflow: hidden`, and
forced-colors mode keeps it without any extra rule. The tokens are already
generated: `focus.width` 2px, `focus.offset` 2px, `border.focus` = accent 9,
which the contrast check holds at 3:1 against both surfaces (0022).

- Only `:focus-visible`, never `:focus`, so a mouse press does not ring
- Components never define their own focus style; a component that needs the ring inside itself sets `outline-offset` to a negative value, nothing else
- Invalid fields keep their danger-toned border and halo, and still take the same ring when focused

## Consequences

- Forced-colors mode needs no override: `outline` already uses the system's own colours, and `border.focus` is ignored there (0027)
- A ring on a surface with the same colour as the ring would be invisible, so `border.focus` may never be used as a surface background

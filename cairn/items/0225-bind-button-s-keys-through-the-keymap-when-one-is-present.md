---
id: 225
uid: 88555935-73f3-4aca-8078-6de9f160f266
title: Bind Button's keys through the Keymap when one is present
type: feature
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 141
- 224
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
priority: p2
layer: components
effort: s
---

## Problem

Inside a `<Keymap>`, a Button with `keys` describes and announces its chord but
does not bind it; the app has to bind it again with `useKeymap`.

## Acceptance criteria

- [x] Inside a Keymap, `keys` registers a binding whose target is the button itself, so the chord is described, announced and bound from one spec
- [x] Outside a Keymap nothing changes, and a story proves both

## 2026-10-03

On #145: Button calls useKeymapIfAny with its own ref as the target, and only when it is not disabled. The stories "A Button's keys, bound" and "... with no keymap" prove both sides. #145 also carries keyShortcut's WAI-ARIA key names and formatKeys' letter case.

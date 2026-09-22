Kept separate on purpose:

| Contract | What it holds | Built on |
| --- | --- | --- |
| **Tokens** | Design decisions as data, in three tiers: reference → semantic → component | DTCG 2025.10 + Resolver module, Terrazzo |
| **Behaviour** | Accessibility, focus, keyboard, state. No styling | A headless primitives library |
| **Style** | CSS that reads semantic tokens and `data-*` state, and nothing else | Custom properties, `@layer`, container queries |

Components consume **semantic tokens only**. Themes remap the semantic tier. The published
CSS is the contract every consumer shares.

Milestones are ordered by dependency: each one waits on the last. This file is generated
by `cairn render`; edit the items, not this page.

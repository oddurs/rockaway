---
id: 175
uid: b9a6f18e-d75c-4158-9a56-2f28a1b989fd
title: Never let a junction overwrite a title
type: bug
status: backlog
milestone: primitives
created: 2026-10-03
updated: 2026-10-03
priority: p1
layer: grid
effort: s
---

## What happens

A title set into an edge is text laid over border cells. When a rule is drawn
into the same edge after it — a column rule meeting a titled top edge — the
junction replaces the letter in that cell: `┌ singl┬ ───┐`, `╭ round┬d ─╮`.
Seen in the continuity matrix (0117) and present before it, drawn by the font
just the same. No shipped component hits it yet; Panes (0136) and Table (0057)
will, on their first titled edge with a column under it.

## What should happen

A title owns the cells it is drawn in. It truncates, with the theme's ellipsis,
before the first junction in its edge, so it sits in its own segment of the
edge the way a pane title does in tmux or htop. The junction still resolves
from the edges, so drawing order still does not matter.

## Acceptance criteria

- [ ] A title truncates before the first junction in its edge, whichever was drawn first, with a text snapshot of both orders
- [ ] A title that fits between the corner and the first junction is untouched
- [ ] `titleAlign` center and end obey the same rule
- [ ] The continuity matrix's titles read whole, or truncated with an ellipsis, never cut by a tee

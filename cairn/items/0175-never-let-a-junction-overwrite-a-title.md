---
id: 175
uid: b9a6f18e-d75c-4158-9a56-2f28a1b989fd
title: Never let a junction overwrite a title
type: bug
status: done
milestone: primitives
assignee: Oddur Sigurdsson
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
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

- [x] A title truncates before the first junction in its edge, whichever was drawn first, with a text snapshot of both orders
- [x] A title that fits between the corner and the first junction is untouched
- [x] `titleAlign` center and end obey the same rule
- [x] The continuity matrix's titles read whole, or truncated with an ellipsis, never cut by a tee

## 2026-10-03

Labels are recorded on the buffer (drawLabel, packages/grid/src/label.ts) and set into their edge when a draw pass closes, so the result is the same whichever was drawn first, and across passes: a later pass that adds a rule re-sets the title and gives back the cells it no longer uses. A junction is any interior cell of the edge a line crosses (north or south weight). start takes the first segment, end the last, center the one under the middle (or the one before it if the middle is a junction). Divider labels go through the same function. Folded in from Frame polish (0129, polish-chrome): a label may use width - 3 (corners plus one cell of edge), so ╭ rounded ─╮ fits at width 12; and truncate now drops a space before the ellipsis (far too… not far too …). Snapshots that changed: grid draw/label tests, react frame/divider/glyphs/metadata, workbench Glyphs › Ascii.

## Result

Titles and rule labels are set into their edge when the draw pass closes: they own their cells, stop before the first junction, and truncate with the theme's ellipsis, whichever was drawn first.

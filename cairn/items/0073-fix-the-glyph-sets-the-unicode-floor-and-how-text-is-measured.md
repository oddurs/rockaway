---
id: 73
title: Fix the glyph sets, the Unicode floor and how text is measured
type: decision
status: done
milestone: grid
created: 2026-09-22
updated: 2026-09-22
closed_at: 2026-09-22
priority: p0
layer: grid
effort: m
---

## Context

Box drawing is only reliable if every glyph is one cell wide in every font the
system allows, and if the engine knows the width of the text it lays out.
East Asian characters take two cells, combining marks take none, and emoji are
a lottery.

## Decision

Decided 2026-09-23.

**Border sets**, chosen per theme and per box: `single ─│┌┐└┘`, `double ═║╔╗╚╝`,
`heavy ━┃┏┓┗┛`, `rounded ─│╭╮╰╯`, `ascii -|++++`. Sets mix: a heavy box may
hold light dividers, and the junction model resolves the seam.

**Unicode is the floor; ASCII is a set, not a fallback.** The engine never
silently degrades: an app that needs ASCII asks for it, and gets a frame drawn
in `-|+` that measures identically.

**Marks** (`✓ ✗ ! ▸ ▾ ░▒▓ █ ▁▂▃▄▅▆▇ ⠋⠙⠹`) are tokens, so a theme can swap the
set. **No emoji anywhere**: their width is unpredictable, and they break the
one promise the system makes.

**Measurement** is `wcwidth` over Unicode 15 East Asian Width, implemented in
the engine: 2 for wide and fullwidth, 0 for combining marks and zero-width
joins, 1 for the rest. Truncation happens on cell boundaries with `…`, and
never splits a grapheme cluster.

## Consequences

- A CJK string lays out correctly, or the test says where it did not
- The glyph tokens are a real part of the theme: an ASCII theme is a theme, not a downgrade
- Fonts are constrained to monospace families with a full box-drawing block, which the site states plainly

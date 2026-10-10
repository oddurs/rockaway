# Strictness

A grid nobody can break is a grid people quietly abandon. So the grid can be
broken, on two conditions: the screen says how strict it is, and every box that
breaks it says why.

## Three levels

| Level | What the check holds to the grid |
| --- | --- |
| `strict` | Every box, in whole cells; and the glyph painter only |
| `standard` | Every box, in whole cells, except half a cell inside a control (`data-rk-control`); either painter |
| `loose` | Screens and panes (`data-rk-pane`) in whole cells; anything inside a pane is free |

`standard` is the default. A theme can choose another with its `conformance`
input, and a screen with an attribute, on itself or any element around it:

```html
<main data-rk-conformance="strict">…</main>
```

The level belongs to the screen, not to a box inside it. A component cannot
loosen the app it is placed in, and a screen nested in another is held to both
levels: nesting can tighten the grid, never relax it. A level that is not one
of the three, a typo, is reported rather than quietly read as `standard`.

## An exception you mean

To put a box off the grid on purpose, say so, and say why:

```html
<div data-rk-offgrid="the logo is 37px and the brand team won">…</div>
```

An empty reason is not a reason. `data-rk-offgrid=""` fails on its own,
because an exception nobody can explain is the quiet kind this exists to stop.

## The check

`checkConformance`, from `@rockaway/react/testing`, measures every box inside a
screen against the cell, at the screen's level, and returns a report;
`expectConformance` throws with it. Violations come first, then the exceptions
somebody declared, grouped by reason and counted, so a page can say how many
times it broke the grid and why:

<!-- part: report -->

That report is the real formatter's output, for a screen with one box off the
grid and two declared exceptions that share a reason. The workbench runs the
check after every story, at every density and in both modes. The screen's own
box is exempt: the page decides how much room a screen gets, and the grid
governs what is drawn inside it.

The deal is not "never break the grid". Breaking it quietly is what is
forbidden: exceptions become things you can count, instead of things that
pile up.

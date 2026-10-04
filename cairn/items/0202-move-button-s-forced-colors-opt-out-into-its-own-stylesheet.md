---
id: 202
uid: f1089592-b76d-4f4e-8c43-1757ff103d81
title: Move Button's forced-colors opt-out into its own stylesheet
type: chore
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 131
- 181
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
priority: p3
layer: css
effort: s
---

## Problem

Button's backplate opt-out sits in `forced-colors.css` only because Button was
being polished in parallel (0181). Its own stylesheet should own it.

## Acceptance criteria

- [x] The rule lives in `button.css`, or every component uses one shared marker

## 2026-10-03

Moved into the component stylesheets, Link and List as well as Button, so each stylesheet owns whatever it reverses. Each rule is a forced-colors media block inside its rk.components layer. forced-colors.css keeps only the base's own reversal, painted [data-attrs~=reverse]. Forced colors > Reverse video still passes in pixels for every reversed subject. #118's opt-out test accepts an opt-out in any file, so it needs no change; whichever of the two merges second takes a one-line merge in the forced-colors.css selector list, because #118 adds [data-rk-fill]:focus-visible there.

## Result

Button, Link and List opt out of the forced-colors backplate in their own stylesheets; forced-colors.css keeps the base's painted reverse cells.

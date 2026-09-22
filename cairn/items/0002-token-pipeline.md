---
id: 2
key: tokens
title: Token pipeline
type: milestone
status: done
depends_on:
- 1
created: 2026-09-22
updated: 2026-09-22
priority: p2
due: 2026-10-25
---

Design decisions as data, compiled to CSS custom properties.

DTCG 2025.10 sources in three tiers, OKLCH scales generated rather than
hand-picked, light and dark expressed through the Resolver module, and contrast
checked in CI. Done means a component author can style anything from semantic
tokens alone.

## 2026-09-22

Done 2026-09-22, ahead of the 2026-10-25 due date. Five theme inputs generate DTCG 2025.10 tokens; Terrazzo compiles them to --rk-* custom properties with mode and density contexts that nest; 104 declared contrast pairs hold in both modes across 55 themes; the workbench documents every token from the generated files. Two accessibility defects in the concept were found and fixed along the way (input borders under 3:1, twice).

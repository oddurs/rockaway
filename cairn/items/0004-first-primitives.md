---
id: d1cb877b-50a8-4f08-934e-95a49eaeb080
key: primitives
title: First primitives
type: milestone
status: backlog
depends_on:
- 5ea85abb-5478-4fc3-a65c-1b52ef12e6d3
- cfec3750-e99e-4ce5-98c8-c258358c3e45
created: 2026-09-22
updated: 2026-09-23
priority: p2
due: 2027-01-31
---

The component contract, proven on a first set of components.

Button goes first and exists to validate the contract; the rest follow once it
holds. Overlays share Popover. Due after the holidays on purpose.

## 2026-09-22

Reshaped by the TUI pivot: the inventory is a TUI inventory, and every component is drawn by the frame engine. The existing component items keep their ids and gain TUI criteria.

## 2026-09-23

docs/concept.md (0112) is the contract for this milestone: the ten rules at the end of it are the acceptance criteria every component item carries, and the component template in cairn.toml now issues them to new items. 0057 Table was created pre-pivot and had only the old six; it has the grid rules now.

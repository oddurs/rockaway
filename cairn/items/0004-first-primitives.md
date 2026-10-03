---
id: 4
uid: d1cb877b-50a8-4f08-934e-95a49eaeb080
key: primitives
title: First primitives
type: milestone
status: backlog
depends_on:
- 3
- 68
created: 2026-09-22
updated: 2026-10-03
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

## 2026-10-03

Program plan (2026-10-03). The milestone runs in waves. In flight: 0116/0117, the cell renderer, which every framed item waits on. Wave 1, now and in parallel with it: the state vocabulary (0118), the variant helper (0032), the metadata schema (0047), theme glyphs then motion then theme contexts in one tokens lane (0119, 0120, 0052), package exports then the barrels (0121, 0122), level-aware conformance (0123), Firefox and WebKit (0124). Wave 2, once 0117 lands: server-painted chrome (0126), the story matrix (0125), the field and overlay contracts (0127, 0128), and a polish pass on each shipped primitive (0129 Frame, 0130 Divider, 0131 Button, 0132 KeyHint, 0133 List). Wave 3: the components on those contracts, with the recipe (0134) written from polished Button. Wave 4: the overlay family's dependants and CommandPalette. Wave 5: the kitchen sink (0064) and the design pass (0142), which is this milestone's last p0.

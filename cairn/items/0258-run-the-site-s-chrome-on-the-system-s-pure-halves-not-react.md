---
id: 258
uid: bf6e638f-f0a0-4292-9e39-675657b86dfb
title: Run the site's chrome on the system's pure halves, not React
type: decision
status: ready
milestone: site
created: 2026-10-04
updated: 2026-10-04
priority: p1
layer: site
effort: s
---

## Purpose

The shell is static HTML repainted by a ~25 kB plain-TypeScript runtime built from the same pure functions as the components (layoutPanes, fitStatus, rowRuns, the grid and keymap engines, copy). React loads only on pages with React demos. A test holds the runtime's repaint equal to the component's server render, cell for cell. Measured in 0104: a React shell cannot get under 100 kB.

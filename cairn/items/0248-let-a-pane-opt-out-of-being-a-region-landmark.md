---
id: 248
uid: b837e19f-cb2d-4752-8c02-de0b782ce26b
title: Let a Pane opt out of being a region landmark
type: feature
status: done
milestone: primitives
assignee: Oddur Sigurdsson
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
priority: p3
layer: components
effort: s
---

## Purpose

A labelled Pane is a region landmark; the site shell passes label="" so its nav, main and aside stay top-level landmarks. Give Pane an explicit way to be a plain container, and document when to use it. Found by the site lead in 0104.

## 2026-10-03

API agreed with site: Pane landmark?: boolean, default true. landmark={false} renders a plain div with no aria-label (aria-label on a generic is prohibited), title still drawn in the chrome. label='' also gives a div now, so the shell's workaround keeps working until it switches. Metadata says a non-landmark pane's content should carry its own named nav/main/aside, at site's request. Stacked on feat/panes (#101) because Pane is not on main yet.

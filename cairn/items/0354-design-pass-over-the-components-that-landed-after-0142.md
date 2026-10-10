---
id: 354
uid: 1676d985-b3b6-4191-af6c-22794000abba
title: Design pass over the components that landed after 0142
type: chore
status: backlog
milestone: v0.1
created: 2026-10-10
updated: 2026-10-10
priority: p1
layer: components
---

0142's pass (#228) covered every component on main on 2026-10-09. Since then these landed and were not in it: Breadcrumbs, Card, ComboBox, Dialog and AlertDialog, LinkTree, Meter, Picture, ProgressBar, RadioGroup, SkipLink, Sparkline, Spinner, StatusBar, Tabs, Text, Toolbar and Tooltip. Do the same pass on the kitchen sink, which holds them all (now at standard, 0311), against the ten rules, with the component × rule table in a note.

## Acceptance criteria

- [ ] Each component listed is checked against the ten rules, the table in a note
- [ ] Each finding is fixed or filed

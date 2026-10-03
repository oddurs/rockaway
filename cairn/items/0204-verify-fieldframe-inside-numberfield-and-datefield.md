---
id: 204
uid: cefc7740-913a-404f-bc70-6c4df603a26f
title: Verify FieldFrame inside NumberField and DateField
type: chore
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 127
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
priority: p2
layer: components
effort: s
---

## Problem

Those components provide React Aria's `GroupContext`, which `FieldFrame`'s `Group`
would merge in. Verify it when Select and NumberField are built.

## Acceptance criteria

- [x] A story frames a NumberField and a DateField with `FieldFrame`, and state attributes come through once

## 2026-10-03

Found a real leak: DateField's GroupContext reached FieldFrame's Group, so the frame carried the field's aria-labelledby and data-react-aria-pressable as well as the DateInput, and was a second element labelled by the field. NumberField's context reached it too (its group props are fewer: no labelledby). FieldFrame now provides GroupContext null to its own Group and restores the outer value for its children, so the frame takes nothing and the framed group gets everything once. Components/FieldFrame in groups proves both, and that the number group still steps from the keyboard (the field's handlers reached it).

## Result

FieldFrame shields its own Group from a surrounding GroupContext and passes the context on to what it frames. A framed NumberField or DateField is labelled once, on the group React Aria meant, and keeps its keyboard behaviour.

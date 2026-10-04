---
id: 184
uid: d3a1824f-2a5b-4592-981c-c3ed821db26e
title: Selected-and-disabled rows trap the first arrow key
type: bug
status: done
milestone: primitives
assignee: Oddur Sigurdsson
depends_on:
- 133
created: 2026-10-03
updated: 2026-10-03
closed_at: 2026-10-03
priority: p2
layer: components
effort: s
---

## What happens

In a List with a row that is both selected and disabled, Tab focuses the first
row and the first ArrowDown does nothing. React Aria's focused key appears to
start on the disabled selected row. Found in 0133.

## Acceptance criteria

- [x] A story reproduces it
- [x] Fixed here, or reported upstream with the issue linked and a workaround in place

## 2026-10-03

What actually happens: Tabbing into a list whose selected row is disabled, React Aria's useSelectableCollection navigates to manager.firstSelectedKey on focus entry without checking that the row is disabled. The row cannot take focus, so focus stays on the listbox itself and no row has the cursor. The first ArrowDown then enters on the first enabled row. Plain RAC ListBox does exactly the same, so this is upstream behaviour and not List's. It looked like a trap because list.css set outline: none on the listbox, so focus held by the list itself was invisible, and because 0133's story helper matched [data-focused] on the listbox too and reported a cursor that was not there. My 0133 note was wrong on that point.

## 2026-10-03

Fix: drop list.css's outline: none, so the shared focus ring (focus.css, the 0118 focus-unframed row) draws whenever the list itself holds focus. While a row has focus the list does not match :focus-visible, so the ring shows only when nothing else would. The same fix covers an empty list, whose focus was invisible too. No focus logic is added; a focus hand-over was tried and dropped. Components/List > Disabled and selected reproduces it and fails without the fix (outline none). Empty checks the ring. List's metadata names focus-unframed on List. Upstream, not filed: React Aria's useSelectableCollection onFocus could fall back to delegate.getFirstKey() when firstSelectedKey is disabled, which would put the cursor on the first enabled row on entry. Worth an issue on adobe/react-spectrum if the owner wants that behaviour.

## Result

Fixed here: a list holding focus itself now shows the focus ring, so the keyboard is never invisible. React Aria's choice not to enter on a disabled selected row is upstream behaviour; an issue is drafted in the notes, not filed.

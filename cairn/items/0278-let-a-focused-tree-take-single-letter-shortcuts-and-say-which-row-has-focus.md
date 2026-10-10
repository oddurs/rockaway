---
id: 278
uid: aa22ddce-56b7-4244-a27c-5a2ed16c196d
title: Let a focused Tree take single-letter shortcuts, and say which row has focus
type: feature
status: review
milestone: primitives
assignee: Oddur Sigurdsson
claimed: 2026-10-09
created: 2026-10-09
updated: 2026-10-09
priority: p2
layer: components
effort: m
---

## Purpose

React Aria 1.21's Tree has no disallowTypeAhead, so typeahead takes every printable key, and nothing reports the focused row. Found building the git client (0151).

## 2026-10-09

React Aria's Tree honours disallowTypeAhead without declaring it: RAC's Tree spreads its props into useTree, which is useGridList, whose options take disallowTypeAhead (RAC's GridList declares it). Our Tree declares it and passes it through. The focused row: React Aria gives each row isFocused in its render props, so a small component inside each row reports gain and loss to the Tree through context; a loss waits a microtask so a move between rows is one report, and a loss with no gain is null. No key or focus listener: no-hand-listeners lists onFocusedKeyChange as an allowed name with its reason, since the rule matches on 'onFocus'. Story 'Beside single-letter shortcuts' (real keys through a Keymap) fails without the option.

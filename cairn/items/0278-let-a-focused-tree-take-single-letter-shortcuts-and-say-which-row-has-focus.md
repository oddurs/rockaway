---
id: 278
uid: aa22ddce-56b7-4244-a27c-5a2ed16c196d
title: Let a focused Tree take single-letter shortcuts, and say which row has focus
type: feature
status: ready
milestone: primitives
created: 2026-10-09
updated: 2026-10-09
priority: p2
layer: components
effort: m
---

## Purpose

React Aria 1.21's Tree has no disallowTypeAhead, so typeahead takes every printable key, and nothing reports the focused row. Found building the git client (0151).

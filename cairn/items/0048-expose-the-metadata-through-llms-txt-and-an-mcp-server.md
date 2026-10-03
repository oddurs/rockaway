---
id: 48
uid: 87656858-a060-47ec-898c-bd1c37b7521a
title: Expose the metadata through llms.txt and an MCP server
type: feature
status: doing
milestone: v0.1
assignee: Oddur Sigurdsson
claimed: 2026-10-03
depends_on:
- 47
- 104
- 147
created: 2026-09-22
updated: 2026-10-03
priority: p2
layer: docs
effort: m
---

## Problem

Agents are a large share of the system's users (0047). They should be able to
ask what exists and how it is used without scraping HTML.

## Acceptance criteria

- [ ] `llms.txt` and `llms-full.txt` generated from the metadata and the docs at site build
- [ ] Every component page has a Markdown twin at `/components/<name>.md`, including its text snapshot
- [ ] An MCP server (stdio), published as a package, offering: list components, get a component (metadata and snapshot), get tokens, search the docs
- [ ] A CI test drives the MCP server with a client and checks every tool's answer against the metadata

## 2026-10-03

Rewritten by the program plan: the pre-pivot template text is replaced with how this works on the grid, the criteria are one list (the template, plus the contracts from the plan, plus this item's own), and the dependencies point at the contracts it is built on.
